import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, Trash2, Sparkles, Terminal, FileCode, Bot, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/FirebaseProvider';
import { codeStudioAPI } from '../lib/api';

// Monaco is dynamically imported to keep bundle lighter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonacoLike = any;

type CodeProject = {
  project_id: string;
  title: string;
  language?: string;
  platform?: string;
  status?: string;
};

type CodeSession = {
  session_id: string;
  project_id: string;
};

type FileMap = Record<string, string>;

type Toast = { id: string; type: 'success' | 'error' | 'info'; title: string; detail?: string };

export default function CodeStudio() {
  const { user, profile } = useAuth();
  const userId = user?.uid || 'anonymous';
  const username = profile?.username || user?.displayName || 'User';

  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [projectRequest, setProjectRequest] = useState('Build a simple full-stack app: a React UI with a FastAPI backend that has a notes CRUD and stores data in memory.');
  const [projectTitle, setProjectTitle] = useState('Neon Notes');
  const [platform, setPlatform] = useState<'fullstack'>('fullstack');
  const [language, setLanguage] = useState<'TypeScript'>('TypeScript');

  const [project, setProject] = useState<CodeProject | null>(null);
  const [session, setSession] = useState<CodeSession | null>(null);
  const [files, setFiles] = useState<FileMap>({});

  const [activeFile, setActiveFile] = useState<string>('');
  const [tabs, setTabs] = useState<string[]>([]);

  const [editorModule, setEditorModule] = useState<MonacoLike | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const [aiAssistantInput, setAiAssistantInput] = useState('Add validation, and fix any bugs. Also update the UI for better UX.');
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [taskBreakdown, setTaskBreakdown] = useState<string>('');

  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [runOutput, setRunOutput] = useState<string>('');

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [selectedError, setSelectedError] = useState<string>('');

  const canEdit = userId !== 'anonymous';

  const fileList = useMemo(() => {
    const paths = Object.keys(files);
    paths.sort((a, b) => a.localeCompare(b));
    return paths;
  }, [files]);

  const addToast = (t: Omit<Toast, 'id'>) => {
    const toast: Toast = { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, ...t };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== toast.id));
    }, 4000);
  };

  const ensureEditorLoaded = async () => {
    if (editorModule) return;
    // Lazy load Monaco to avoid bundling overhead.
    const mod = await import('@monaco-editor/react');
    setEditorModule(mod);
  };

  useEffect(() => {
    ensureEditorLoaded().catch(() => {
      addToast({ type: 'error', title: 'Editor failed to load', detail: 'Install @monaco-editor/react dependencies.' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeFile) {
      const first = fileList[0];
      if (first) setActiveFile(first);
    }
  }, [fileList, activeFile]);

  useEffect(() => {
    if (activeFile && !tabs.includes(activeFile)) {
      setTabs((prev) => [...prev, activeFile]);
    }
  }, [activeFile, tabs]);

  const openFile = (path: string) => {
    setActiveFile(path);
  };

  const createNewProject = async () => {
    if (!canEdit) {
      addToast({ type: 'error', title: 'Guest mode', detail: 'Create projects requires authentication.' });
      return;
    }

    setTerminalLines([]);
    setLogs([]);
    setRunOutput('');
    setSelectedError('');

    addToast({ type: 'info', title: 'Planning project…' });
    setTaskBreakdown('Planning project structure…');

    try {
      const res = await codeStudioAPI.createProject({
        user_id: userId,
        title: projectTitle.trim() || 'Code Studio Project',
        language,
        platform,
        initial_request: projectRequest,
      });

      setProject(res.project);
      setSession(res.session);

      setFiles(res.files);
      setTabs([]);
      setActiveFile('');

      // Kick off generation flow for first file.
      await continueGeneration('initial');

      // Load complete state after generation starts
      try {
        const updated = await codeStudioAPI.loadProject({
          user_id: userId,
          project_id: res.project.project_id,
        });
        setFiles(updated.files);
        const firstPath = Object.keys(updated.files).sort((a, b) => a.localeCompare(b))[0];
        if (firstPath) setActiveFile(firstPath);
      } catch {
        // ignore load race
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Project creation failed', detail: e?.message || String(e) });
    }
  };

  const continueGeneration = async (mode: 'initial' | 'continue') => {
    if (!project || !session) return;

    setAssistantThinking(true);
    addToast({ type: 'info', title: mode === 'initial' ? 'Generating project…' : 'Continuing generation…' });

    try {
      const res = await codeStudioAPI.generateNextFile({
        user_id: userId,
        project_id: project.project_id,
        session_id: session.session_id,
      });

      if (res.status === 'file_generated') {
        const next = res.file_path;
        const updated = await codeStudioAPI.loadProject({
          user_id: userId,
          project_id: project.project_id,
        });

        setFiles(updated.files);
        setActiveFile(next);
        addToast({ type: 'success', title: 'File generated', detail: next });
        setTaskBreakdown(`Generated: ${next}`);
      } else if (res.status === 'ready') {
        addToast({ type: 'success', title: 'Project is ready', detail: 'All planned files generated.' });
        setTaskBreakdown('Ready for run.');
      } else {
        addToast({ type: 'info', title: 'Generation status', detail: res.status });
        setTaskBreakdown(`Status: ${res.status}`);
      }
    } catch (e: any) {
      setSelectedError(e?.message || String(e));
      addToast({ type: 'error', title: 'Generation failed', detail: e?.message || String(e) });
    } finally {
      setAssistantThinking(false);
    }
  };

  const runProject = async () => {
    if (!project || !session) return;
    setAssistantThinking(true);
    setTerminalLines((prev) => [...prev, `> Running ${project.title}…`]);

    try {
      const res = await codeStudioAPI.runProject({
        user_id: userId,
        project_id: project.project_id,
        session_id: session.session_id,
      });

      setRunOutput(res.output || 'Run started');
      setTerminalLines((prev) => [...prev, res.command ? `> ${res.command}` : '> run command']);
      if (res.logs?.length) setTerminalLines((prev) => [...prev, ...res.logs]);
    } catch (e: any) {
      setSelectedError(e?.message || String(e));
      addToast({ type: 'error', title: 'Run failed', detail: e?.message || String(e) });
    } finally {
      setAssistantThinking(false);
    }
  };

  const requestAIContextFix = async () => {
    if (!project || !session) return;
    if (!canEdit) {
      addToast({ type: 'error', title: 'Guest mode', detail: 'Ask AI fixes requires authentication.' });
      return;
    }

    setAssistantThinking(true);
    try {
      // This endpoint can be expanded later; for now, we store input in project context
      // by triggering generation flow which uses session context.
      const res = await codeStudioAPI.saveAssistantPrompt({
        user_id: userId,
        project_id: project.project_id,
        session_id: session.session_id,
        message: aiAssistantInput,
      });

      setTaskBreakdown(res.status || 'Applied prompt.');
      addToast({ type: 'success', title: 'Prompt applied', detail: 'Continuing generation…' });

      await continueGeneration('continue');
    } catch (e: any) {
      addToast({ type: 'error', title: 'AI fix failed', detail: e?.message || String(e) });
      setSelectedError(e?.message || String(e));
    } finally {
      setAssistantThinking(false);
    }
  };

  const MonacoEditor = editorModule?.default || editorModule;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-dark">
      {/* Left sidebar */}
      <aside className="w-80 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col">
        <div className="p-4 space-y-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-widest">OmniMind</div>
              <div className="text-lg font-black text-white">Code Studio</div>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsPlannerOpen(true)}
                className={cn(
                  'p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all',
                  !canEdit && 'opacity-60 cursor-not-allowed'
                )}
                disabled={!canEdit}
                title={!canEdit ? 'Sign in to create projects' : 'New project'}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-[12px] text-gray-500">
            {canEdit ? (
              <>Signed in as <span className="text-primary">{username}</span></>
            ) : (
              <>Guest demo (read-only)</>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Projects</div>
              <div className="text-[11px] text-gray-600">{project?.status || 'idle'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-dark/30 p-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-xl bg-primary/15 border border-primary/20 p-2">
                  <FileCode className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{project?.title || 'No active project'}</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    {Object.keys(files).length ? `${Object.keys(files).length} files` : 'Generate to create files'}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                    canEdit ? 'bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-gray-500'
                  )}
                  onClick={() => continueGeneration('continue')}
                  disabled={!canEdit || !project || !session || assistantThinking}
                >
                  <span className="inline-flex items-center gap-2 justify-center">
                    <RefreshCw className="h-3.5 w-3.5" /> Next file
                  </span>
                </button>

                <button
                  className="w-11 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-black border border-white/10 hover:scale-[1.02] transition-all disabled:opacity-60"
                  onClick={runProject}
                  disabled={!canEdit || !project || !session || assistantThinking}
                  title="Run in WebContainer"
                >
                  <Play className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">File Explorer</div>
              <div className="text-[11px] text-gray-600">{tabs.length} tabs</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-dark/30">
              {fileList.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Start by creating a project.</div>
              ) : (
                <div className="p-2">
                  {fileList.map((path) => (
                    <button
                      key={path}
                      onClick={() => openFile(path)}
                      className={cn(
                        'w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
                        activeFile === path ? 'bg-primary/15 border border-primary/20' : 'hover:bg-white/5'
                      )}
                    >
                      <ChevronRight className={cn('h-4 w-4', activeFile === path ? 'text-primary' : 'text-gray-500')} />
                      <span className={cn('text-[12px] font-medium truncate', activeFile === path ? 'text-white' : 'text-gray-300')}>{path}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Chat History</div>
            <div className="rounded-2xl border border-white/10 bg-dark/30 p-3 text-gray-400 text-[12px]">
              Code chat is integrated into the right panel assistant.
            </div>
          </div>
        </div>
      </aside>

      {/* Center IDE */}
      <main className="flex-1 flex flex-col">
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-dark/50">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="text-[11px] text-gray-500 uppercase tracking-widest font-black">Active file</div>
              <div className="text-sm font-bold truncate max-w-[520px]">{activeFile || '—'}</div>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold"
              disabled={!canEdit || assistantThinking || !activeFile}
              onClick={requestAIContextFix}
              title="Ask AI to fix bugs and improve code"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Fix with AI
              </span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="h-11 border-b border-white/5 flex items-center px-2 gap-2 bg-dark/60">
            <AnimatePresence>
              {tabs.map((t) => (
                <motion.button
                  key={t}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className={cn(
                    'px-3 py-2 rounded-xl text-[12px] font-bold border transition-all',
                    t === activeFile ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  )}
                  onClick={() => setActiveFile(t)}
                >
                  {t.split('/').slice(-1)[0]}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <div ref={editorContainerRef} className="h-[calc(100%-44px)]">
            {editorModule && activeFile ? (
              <MonacoEditor
                height="100%"
                defaultLanguage="typescript"
                value={files[activeFile] || ''}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                }}
                onChange={async (value: string | undefined) => {
                  const next = value ?? '';
                  setFiles((prev) => ({ ...prev, [activeFile]: next }));
                }}
                beforeMount={(monaco: MonacoLike) => {
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2022,
                    allowNonTsExtensions: true,
                    noEmit: true,
                  });
                }}
                theme="vs-dark"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Generating files…</div>
            )}
          </div>
        </div>

        {/* Bottom panel: Terminal */}
        <div className="h-44 border-t border-white/5 bg-dark/40">
          <div className="h-10 px-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-black">
              <Terminal className="h-4 w-4 text-primary" />
              Terminal
            </div>
            <div className="text-xs text-gray-500">Logs & output</div>
          </div>

          <div className="h-[calc(100%-40px)] overflow-y-auto p-3 font-mono text-[12px] text-gray-300">
            <pre className="whitespace-pre-wrap m-0">{terminalLines.length ? terminalLines.join('\n') : '—'}</pre>
            {selectedError && (
              <div className="mt-3 flex items-start gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-bold">AI/System error</div>
                  <div className="whitespace-pre-wrap">{selectedError}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right assistant */}
      <aside className="w-96 border-l border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl border border-primary/20 bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-black">AI Coding Assistant</div>
              <div className="text-xs text-gray-500">Task breakdown & fixes</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-dark/30 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Task breakdown</div>
            <div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{taskBreakdown || 'Plan and generate files to start.'}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-dark/30 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Ask for updates</div>
            <textarea
              value={aiAssistantInput}
              onChange={(e) => setAiAssistantInput(e.target.value)}
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 resize-none min-h-[120px]"
              disabled={!canEdit || assistantThinking}
            />
            <div className="mt-3 flex gap-2">
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-black hover:scale-[1.02] transition-all disabled:opacity-60"
                onClick={requestAIContextFix}
                disabled={!canEdit || assistantThinking || !project}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" /> Apply
                </span>
              </button>
              <button
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-gray-300 hover:bg-white/10 transition-all disabled:opacity-60"
                onClick={() => continueGeneration('continue')}
                disabled={!canEdit || assistantThinking || !project}
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-dark/30 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Suggestions</div>
            <div className="mt-2 space-y-2">
              <div className="text-[12px] text-gray-300">• Generate one file at a time for consistency</div>
              <div className="text-[12px] text-gray-300">• Testing agent corrects TS/React/FastAPI issues</div>
              <div className="text-[12px] text-gray-300">• Debounced save can be added next iteration</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-dark/30 p-3">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Run status</div>
            <div className="mt-2 text-[12px] text-gray-300 whitespace-pre-wrap">{runOutput || '—'}</div>
          </div>
        </div>
      </aside>

      {/* Project planner modal */}
      {isPlannerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsPlannerOpen(false)}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-dark/80 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <div className="text-xl font-black">Create Coding Project</div>
                <div className="text-sm text-gray-500">Planner agent builds a roadmap and file structure.</div>
              </div>
              <button
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => setIsPlannerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Project title</div>
                  <input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Platform</div>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    disabled={!canEdit}
                  >
                    <option value="fullstack">Fullstack</option>
                  </select>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Language</div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    disabled={!canEdit}
                  >
                    <option value="TypeScript">TypeScript</option>
                  </select>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Mode</div>
                  <div className="mt-2 text-sm text-gray-300">Generation + correction + saved sessions</div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Initial request</div>
                <textarea
                  value={projectRequest}
                  onChange={(e) => setProjectRequest(e.target.value)}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none min-h-[140px]"
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-gray-500">
                  {canEdit ? 'A planner agent will build a file roadmap, then files are generated one-by-one.' : 'Guest mode is read-only.'}
                </div>
                <div className="flex gap-3">
                  <button
                    className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-gray-300 hover:bg-white/10 transition-all"
                    onClick={() => setIsPlannerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-black hover:scale-[1.02] transition-all disabled:opacity-60"
                    onClick={createNewProject}
                    disabled={!canEdit || assistantThinking}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Create
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toasts */}
      <div className="fixed top-20 right-4 z-[60] space-y-2 w-[320px]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                'rounded-2xl border p-3 shadow-2xl backdrop-blur-xl',
                t.type === 'success' && 'bg-green-500/10 border-green-500/20',
                t.type === 'error' && 'bg-red-500/10 border-red-500/20',
                t.type === 'info' && 'bg-primary/10 border-primary/20'
              )}
            >
              <div className="font-black text-sm">{t.title}</div>
              {t.detail && <div className="text-[12px] text-gray-300 mt-1 whitespace-pre-wrap">{t.detail}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

