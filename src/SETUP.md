# BCA Material Portal — Setup Guide

## 1. Firebase Project Banao
1. https://console.firebase.google.com par jao → "Add Project"
2. Project banne ke baad, "Web app" add karo (</> icon)
3. Jo config milega (apiKey, authDomain, etc.) usko `src/firebase.js` mein paste karo

## 2. Authentication Enable Karo
1. Firebase Console → Authentication → Get Started
2. Sign-in method → "Email/Password" → Enable karo

## 3. Users Add Karo (Students ko login dene ke liye)
1. Authentication → Users tab → "Add User"
2. Har student ka email + password manually daalo
3. Yehi credentials students ko do (WhatsApp/manually) — koi signup page nahi hai

## 4. Firestore Database Banao
1. Firestore Database → Create Database → Production mode
2. Rules tab mein jaake `firestore.rules` file ka content paste karo aur publish karo

## 5. Material Add Karna (Manual, Firebase Console se)
1. Firestore Database → Start Collection → naam do `semesters`
2. Document ID: `sem1` (sem2, sem3... aise hi)
3. Uske andar sub-collection banao: `subjects`
4. Subject document ID: jaise `dbms`, `java` etc. Field add karo: `name: "DBMS"`
5. Uske andar sub-collection: `materials`
6. Har material document mein fields:
   - `title`: "Unit 1 Notes"
   - `type`: "Notes" / "PYQ" / "Assignment"
   - `fileUrl`: (PDF ka link — Google Drive share link ya Firebase Storage link)

**Tip:** Shuru mein Google Drive PDF links use karo (Storage cost bachega) — Drive file ko "Anyone with link can view" karke uska link `fileUrl` mein daal do.

## 6. Local Run Karo
```bash
npm install
npm run dev
```

## 7. Deploy (Free)
- Vercel: `npm run build` → Vercel par drag-drop ya GitHub se connect
- ya Firebase Hosting: `firebase deploy`

## Project Structure
```
src/
  firebase.js       -> Firebase config
  AuthContext.jsx    -> Login state management
  ProtectedRoute.jsx -> Blocks access without login
  App.jsx            -> Routes
  pages/
    Login.jsx
    Home.jsx          -> Semester list
    Subjects.jsx       -> Subject list for a semester
    Materials.jsx      -> PDF/notes list for a subject
```

## Next Steps (baad mein)
- Admin panel banao taaki tum console kholе bina material add kar sako
- Search bar add karo subject/material naam se
- File upload directly app se (Firebase Storage) instead of Drive links
