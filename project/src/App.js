import { useState } from 'react';
import './App.css';

function App() {
  const [nums,setNums] = useState(0);
  return (
    <div className="App">
      <header className="App-header">
        <p onClick={()=>{setNums(nums +1)}}>
          click nums {nums} <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
