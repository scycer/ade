import "./index.css";
import { FileExplorer } from "./components/FileExplorer/FileExplorer";
import { ChatDemo } from "./components/ChatDemo";

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ADE - AI-first Development Environment</h1>
      </header>
      <main className="app-main">
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <FileExplorer />
          </div>
          <div style={{ flex: 1 }}>
            <ChatDemo />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
