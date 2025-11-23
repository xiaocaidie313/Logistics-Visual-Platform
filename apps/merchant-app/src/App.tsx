import { Button } from "@repo/ui/button";
import "./App.css";

function App() {
  return (
    <main className="app">
      <div className="container">
        <h1>可视化物流平台 - 商户端</h1>
        <div className="content">
          <p>欢迎使用物流可视化平台商户管理系统</p>
          <Button appName="商户端">开始管理</Button>
        </div>
      </div>
    </main>
  );
}

export default App;

