import validators
import streamlit as st
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain.chains.summarize import load_summarize_chain
from langchain.chains import RetrievalQA
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import UnstructuredURLLoader, UnstructuredFileLoader
from langchain_community.document_loaders import YoutubeLoader
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

st.set_page_config(page_title="LangChain: Summarize & QA", page_icon="🦜", layout="wide")
st.title("🦜 LangChain: Summarize & Ask Questions (Website / YouTube / Documents)")

with st.sidebar:
    groq_api_key = st.text_input("Groq API Key", value="", type="password")
    hf_embedding_model = st.text_input("Embedding model (HuggingFace)", value="sentence-transformers/all-MiniLM-L6-v2")
    max_chunk_chars = st.number_input("Chunk size", value=1000, min_value=200, max_value=4000)
    chunk_overlap = st.number_input("Chunk overlap", value=200, min_value=0, max_value=1000)

source = st.text_input("Enter URL (website or YouTube) or leave empty to upload files", value="")
uploaded_files = st.file_uploader("Or upload documents (pdf, txt, docx)", accept_multiple_files=True)

summary_words = st.slider("Summary length (approx words)", min_value=50, max_value=1000, value=300, step=50)

def load_documents_from_source(url, uploaded_files):
    docs = []
    if url and validators.url(url):
        if "youtube.com" in url or "youtu.be" in url:
            loader = YoutubeLoader.from_youtube_url(url, add_video_info=True)
            docs = loader.load()
        else:
            loader = UnstructuredURLLoader(urls=[url], ssl_verify=False,
                                           headers={"User-Agent": "Mozilla/5.0"})
            docs = loader.load()
    if uploaded_files:
        for f in uploaded_files:
            try:
                loader = UnstructuredFileLoader(f, mode="elements")
                d = loader.load()
                docs.extend(d)
            except Exception:
                # fallback: read binary/text
                try:
                    text = f.getvalue().decode("utf-8", errors="ignore")
                    docs.append(type('D', (), { 'page_content': text }))
                except Exception:
                    continue
    return docs

@st.cache_data
def build_vectorstore(docs, hf_model, chunk_size, chunk_overlap):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    texts = splitter.split_documents(docs)
    embeddings = HuggingFaceEmbeddings(model_name=hf_model)
    try:
        vectorstore = FAISS.from_documents(texts, embeddings)
    except Exception as e:
        st.error(f"Failed to build vectorstore: {e}")
        return None
    return vectorstore

def make_llm(api_key: str):
    if not api_key:
        st.warning("Provide Groq API key in the sidebar to call the LLM")
    return ChatGroq(model="Gemma-7b-It", groq_api_key=api_key)

summarize_prompt = PromptTemplate(template="""
Provide a concise summary (~{words} words) of the content below. Preserve key points and structure.
Content:
{text}
""", input_variables=["text", "words"])

llm = make_llm(groq_api_key)

if st.button("Load Content"):
    if not groq_api_key:
        st.error("Please enter Groq API Key in the sidebar")
    elif not source and not uploaded_files:
        st.error("Provide a URL or upload at least one document")
    else:
        try:
            with st.spinner("Loading documents..."):
                docs = load_documents_from_source(source, uploaded_files)
                if not docs:
                    st.error("No content found from the source(s)")
                else:
                    st.session_state['docs'] = docs
                    st.success(f"Loaded {len(docs)} document(s) / pieces of content")
        except Exception as e:
            st.exception(e)

if 'docs' in st.session_state:
    docs = st.session_state['docs']
    st.markdown(f"**Loaded content pieces:** {len(docs)}")

    col1, col2 = st.columns([2,1])
    with col1:
        if st.button("Summarize Content"):
            try:
                with st.spinner("Summarizing..."):
                    chain = load_summarize_chain(llm, chain_type="map_reduce", prompt=summarize_prompt)
                    # combine page contents
                    full_text = "\n\n".join([d.page_content for d in docs if getattr(d, 'page_content', None)])
                    output = chain.run({"text": full_text, "words": summary_words})
                    st.success("Summary")
                    st.write(output)
            except Exception as e:
                st.exception(e)

        st.markdown("---")
        st.subheader("Ask a question about the loaded content")
        question = st.text_input("Question")
        if st.button("Ask"):
            if not question.strip():
                st.error("Enter a question to ask")
            else:
                try:
                    with st.spinner("Building retriever and answering..."):
                        vs = build_vectorstore(docs, hf_embedding_model, max_chunk_chars, chunk_overlap)
                        if vs is None:
                            st.error("Could not create vectorstore for QA")
                        else:
                            retriever = vs.as_retriever(search_type="similarity", search_kwargs={"k":4})
                            qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)
                            answer = qa.run(question)
                            st.write(answer)
                except Exception as e:
                    st.exception(e)

    with col2:
        st.subheader("Content Preview")
        for i, d in enumerate(docs[:5]):
            text = getattr(d, 'page_content', '')
            st.write(text[:800] + ("..." if len(text) > 800 else ""))

else:
    st.info("No content loaded yet. Enter a URL or upload files, then click 'Load Content'.")
