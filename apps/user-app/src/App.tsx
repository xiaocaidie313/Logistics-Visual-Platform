import { Button } from "@repo/ui/button";
import "./App.css";

function App() {
  return (
    <main className="app">
      <div className="container">
        <h1>可视化物流平台 - 用户端</h1>
        <div className="content">
          <p>欢迎使用物流可视化平台</p>
          <Button appName="用户端">开始使用</Button>
        </div>
      </div>
    </main>
  );
}

export default App;

