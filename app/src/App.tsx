import { TodoDisplay } from "./TodoDisplay";
import { ScratchDisplay } from "./ScratchDisplay";
import "./index.css";


export function App() {
  return (
    <div className="flex min-h-screen p-4 gap-4">
      <div className="flex-1 max-h-screen">
        <TodoDisplay />
      </div>
      <div className="flex-1 max-h-screen">
        <ScratchDisplay />
      </div>
    </div>
  );
}

export default App;
