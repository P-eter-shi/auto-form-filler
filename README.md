
# 🧠 Automated Form Filler App
# Helps in efficient and time saving of filling office forms

A modern **AI-powered web app** that transforms static `.xhtml` or `.html` documents into **interactive, editable, and voice-controllable forms**.

Built for automation, accessibility, and document digitization — the app enables users to **speak** to fill forms intelligently using **OpenAI’s GPT models**.

---

## 🌟 Key Features

✅ **Editable Form Fields**
- Converts blank lines, `(fill)` tags, or placeholders into interactive editable regions.
- Preserves the original structure and layout of the document.

🎙 **Voice-Controlled Input**
- Double-click on any editable field to activate **voice input**.
- Your speech is transcribed and interpreted by an AI agent.
- Supports natural commands:
  - “John Smith” → fills text.
  - “Add incorporated” → appends text.
  - “Clear this field” → clears field content.
  - “1,200” → recognizes numerical input.

🖼 **Smart Image Uploads**
- Right-click on any field to upload or replace an image/logo.

📊 **Data Export Options**
- Export filled forms to:
  - Excel (`.xlsx`)
  - Printable PDF
  - Editable HTML document

🔍 **User-Friendly Interface**
- Responsive UI (works on desktop and mobile)
- Zoom controls for precision editing
- Clean and minimal layout for reports and forms

---

## 🧩 Architecture Overview


=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> 166bb1b (commits)
