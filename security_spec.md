# Security Specification - OmniMind

## Data Invariants
1. A user can only read and write their own profile (except admins).
2. Blogs are public for reading, but only admins can create, update, or delete them.
3. Contact messages can be created by anyone, but only admins can read or update them.
4. Chats and messages are strictly private to the user who owns them.
5. All IDs must be valid alphanumeric strings.
6. All timestamps must be server-generated.

## The Dirty Dozen Payloads
1. **Identity Theft (User Profile)**: Attempting to create a user profile with a different `userId` than the authenticated user.
2. **Privilege Escalation**: Attempting to set `role: "admin"` on a user profile during registration.
3. **Blog Hijack**: A non-admin user attempting to post a blog entry.
4. **Blog Defacement**: A non-admin user attempting to update an existing blog title.
5. **PII Leak**: An authenticated user attempting to read another user's profile metadata (email, phone).
6. **Chat Snooping**: User A attempting to list or read Chat sessions belonging to User B.
7. **Message Injection**: User A attempting to add a message to User B's chat history.
8. **Contact Spam (Ghost Fields)**: Sending a contact message with extra fields like `isPriority: true` to bypass status checks.
9. **Status Manipulation**: A regular user attempting to mark their own contact message as "replied".
10. **Resource Poisoning**: Using a 2KB string as a `chatId` to cause storage overhead.
11. **Timestamp Spoofing**: Sending a `createdAt` date from 2000 to manipulate sorting logic.
12. **Shadow Update (Blog)**: Adding a `rating` field to a blog post when it's not in the schema.

## The Test Runner (Plan)
We will implement `firestore.rules.test.ts` using the Firebase Emulator suite to verify these payloads are blocked.
