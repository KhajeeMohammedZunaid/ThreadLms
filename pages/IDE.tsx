import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MonacoEditor from '../components/MonacoEditor';
import { HtmlIcon, CssIcon, JavaScriptIcon, PythonIcon, RunIcon, SpinnerIcon, XIcon, DownloadIcon } from '../components/icons';
import ElectricalIDE from '../components/ElectricalIDE';
import MechanicalIDE from '../components/MechanicalIDE';
import CivilIDE from '../components/CivilIDE';

declare global {
  interface Window {
    Sk: any;
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
} as const;

type Language = 'html' | 'css' | 'javascript' | 'python' | 'java';

interface CodeFile {
  id: string;
  name: string;
  language: Language;
  content: string;
}

const defaultFiles: CodeFile[] = [
  {
    id: 'html',
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Interactive IDE</h1>
    <p>Edit HTML, CSS, and JavaScript to see live changes!</p>
    <button onclick="greet()">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`
  },
  {
    id: 'css',
    name: 'styles.css',
    language: 'css',
    content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}`
  },
  {
    id: 'js',
    name: 'script.js',
    language: 'javascript',
    content: `// Interactive JavaScript
function greet() {
  const message = 'Hello from the IDE! 🚀';
  alert(message);
  console.log(message);
}

// Example: Array manipulation
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);

// Example: Async operation
setTimeout(() => {
  console.log('Page loaded successfully!');
}, 1000);`
  },
  {
    id: 'python',
    name: 'main.py',
    language: 'python',
    content: `# Python Programming
def fibonacci(n):
    """Calculate Fibonacci sequence"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Print Fibonacci sequence
for i in range(10):
    print(f"Fibonacci({i}) = {fibonacci(i)}")

# List comprehension example
squares = [x**2 for x in range(10)]
print(f"Squares: {squares}")

# Dictionary example
student = {
    'name': 'John Doe',
    'age': 20,
    'grade': 'A'
}
print(f"Student: {student}")`
  },
  {
    id: 'java',
    name: 'Main.java',
    language: 'java',
    content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        // Calculate factorial
        int n = 5;
        int factorial = calculateFactorial(n);
        System.out.println("Factorial of " + n + " is " + factorial);
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum of array: " + sum);
    }
    
    public static int calculateFactorial(int n) {
        if (n <= 1) return 1;
        return n * calculateFactorial(n - 1);
    }
}`
  }
];

const languageConfig = {
  html: { name: 'HTML', icon: HtmlIcon, color: '#e34c26' },
  css: { name: 'CSS', icon: CssIcon, color: '#264de4' },
  javascript: { name: 'JavaScript', icon: JavaScriptIcon, color: '#f7df1e' },
  python: { name: 'Python', icon: PythonIcon, color: '#3776ab' },
  java: { name: 'Java', icon: JavaScriptIcon, color: '#007396' },
};

const IDE: React.FC = () => {
  const [activeIDE, setActiveIDE] = useState<'code' | 'circuit' | 'beam' | 'structural'>('code');
  const [files, setFiles] = useState<CodeFile[]>(defaultFiles);
  const [activeFileId, setActiveFileId] = useState<string>('html');
  const [output, setOutput] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const ideTools = [
    {
      id: 'code',
      name: 'Code Editor',
      description: 'HTML, CSS, JavaScript, Python & Java',
      branch: 'Computer Science',
    },
    {
      id: 'circuit',
      name: 'Circuit Lab',
      description: 'Electronic circuit design & simulation',
      branch: 'Electrical Engineering',
    },
    {
      id: 'beam',
      name: 'Fusion 360',
      description: 'Autodesk professional CAD/CAM',
      branch: 'Mechanical Engineering',
    },
    {
      id: 'structural',
      name: 'GeoGebra',
      description: 'Mathematics & geometry tool',
      branch: 'Civil Engineering',
    },
  ];

  // Check if Skulpt is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Sk) {
      console.warn('Skulpt is not loaded. Python execution will not work.');
    } else {
      console.log('Skulpt loaded successfully!');
    }
  }, []);

  // Auto-run for HTML/CSS changes
  useEffect(() => {
    if (activeFile.language === 'html' || activeFile.language === 'css') {
      handleRunCode();
    }
  }, [activeFile.content]);

  // Scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const updateFileContent = (content: string) => {
    setFiles(files.map(f => 
      f.id === activeFileId ? { ...f, content } : f
    ));
  };

  const handleDownloadCode = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runPythonCode = async (pyCode: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.Sk) {
        reject("Skulpt Python interpreter is not loaded. Please refresh the page.");
        return;
      }
      
      let fullOutput = '';
      window.Sk.configure({
        output: (text: string) => { fullOutput += text; },
        read: (x: string) => {
          if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles["files"][x] === undefined)
            throw new Error("File not found: '" + x + "'");
          return window.Sk.builtinFiles["files"][x];
        },
        __future__: window.Sk.python3,
        execLimit: 5000 
      });
      const pyPromise = window.Sk.misceval.asyncToPromise(() =>
        window.Sk.importMainWithBody("<stdin>", false, pyCode, true)
      );
      pyPromise.then(
        () => resolve(fullOutput),
        (err: any) => reject(err.toString())
      );
    });
  };

  const runJavaScriptCode = (jsCode: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const logs: string[] = [];
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      // Override console methods
      console.log = (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        logs.push(`▶ ${message}`);
        originalConsole.log(...args);
      };

      console.error = (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`❌ ${message}`);
        originalConsole.error(...args);
      };

      try {
        new Function(jsCode)();
        resolve(logs);
      } catch (err: any) {
        logs.push(`❌ Error: ${err.message}`);
        resolve(logs);
      } finally {
        // Restore console
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
      }
    });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOutput([]);
    
    try {
      const language = activeFile.language;

      if (language === 'html') {
        // Combine HTML with CSS and JS
        const htmlFile = files.find(f => f.language === 'html');
        const cssFile = files.find(f => f.language === 'css');
        const jsFile = files.find(f => f.language === 'javascript');

        let htmlContent = htmlFile?.content || '';
        
        // Inject CSS
        if (cssFile && !htmlContent.includes('<style>') && !htmlContent.includes('styles.css')) {
          htmlContent = htmlContent.replace(
            '</head>',
            `  <style>${cssFile.content}</style>\n</head>`
          );
        }
        
        // Inject JS
        if (jsFile && !htmlContent.includes('<script>') && !htmlContent.includes('script.js')) {
          htmlContent = htmlContent.replace(
            '</body>',
            `  <script>${jsFile.content}</script>\n</body>`
          );
        }

        setOutput(htmlContent);
        setShowPreview(true);
        setConsoleOutput(['✅ HTML rendered successfully with CSS and JS']);
        
      } else if (language === 'css') {
        // Show CSS preview
        const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
  <style>${activeFile.content}</style>
</head>
<body>
  <div class="container">
    <h1>CSS Preview</h1>
    <p>Your styles are applied here. Edit to see changes!</p>
    <button>Sample Button</button>
  </div>
</body>
</html>`;
        setOutput(htmlWrapper);
        setShowPreview(true);
        setConsoleOutput(['✅ CSS applied successfully']);
        
      } else if (language === 'javascript') {
        setShowPreview(false);
        const logs = await runJavaScriptCode(activeFile.content);
        setConsoleOutput(logs.length > 0 ? logs : ['✅ Code executed (no output)']);
        
      } else if (language === 'python') {
        setShowPreview(false);
        const result = await runPythonCode(activeFile.content);
        setConsoleOutput(result ? result.split('\n').filter(Boolean).map(line => `▶ ${line}`) : ['✅ Code executed (no output)']);
        
      } else if (language === 'java') {
        setShowPreview(false);
        setConsoleOutput(['ℹ️ Java execution requires backend server', '💡 Syntax highlighting and editing is available']);
      }
      
    } catch (error: any) {
      setConsoleOutput([`❌ Error: ${error.message || error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants} 
      transition={pageTransition} 
      className="h-screen flex flex-col bg-dark-bg"
    >
      {/* IDE Selector - Professional Dropdown */}
      <div className="flex-shrink-0 bg-dark-sidebar border-b border-dark-border px-4 py-2 flex items-center gap-3">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <select
          value={activeIDE}
          onChange={(e) => setActiveIDE(e.target.value as any)}
          className="flex-1 max-w-xs text-sm bg-dark-bg text-gray-300 border border-dark-border rounded px-3 py-1.5 focus:outline-none focus:border-primary"
        >
          {ideTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name} - {tool.branch}
            </option>
          ))}
        </select>
      </div>

      {/* IDE Content */}
      <AnimatePresence mode="wait">
        {activeIDE === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Compact Control Bar */}
      <div className="flex-shrink-0 bg-dark-sidebar border-b border-dark-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-gray-400">{activeFile.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-dark-bg text-gray-500 rounded">
            {languageConfig[activeFile.language].name}
          </span>
        </div>
        <motion.button
          onClick={handleRunCode}
          disabled={isRunning}
          whileHover={{ scale: isRunning ? 1 : 1.05 }}
          whileTap={{ scale: isRunning ? 1 : 0.95 }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium py-1.5 px-3 rounded transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <SpinnerIcon className="w-3 h-3" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <RunIcon className="w-3 h-3" />
              <span>Run</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className="w-48 bg-dark-sidebar border-r border-dark-border flex flex-col">
          <div className="px-3 py-2 border-b border-dark-border">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Files
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {files.map((file) => {
              const Icon = languageConfig[file.language].icon;
              const isActive = file.id === activeFileId;
              return (
                <motion.button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${
                    isActive 
                      ? 'bg-dark-bg text-white border-l-2 border-primary' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: languageConfig[file.language].color }} />
                  <span className="text-xs font-mono truncate">{file.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Editor and Output */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col border-r border-dark-border">
            {/* Editor Tab Bar */}
            <div className="bg-dark-sidebar border-b border-dark-border px-4 py-2 flex items-center gap-2">
              <div className="flex items-center gap-2 bg-dark-bg px-3 py-1.5 rounded-t-lg">
                {React.createElement(languageConfig[activeFile.language].icon, { 
                  className: "w-4 h-4",
                  style: { color: languageConfig[activeFile.language].color }
                })}
                <span className="text-sm font-mono text-gray-300">{activeFile.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {languageConfig[activeFile.language].name}
              </span>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              <MonacoEditor
                value={activeFile.content}
                language={activeFile.language}
                onChange={(value) => updateFileContent(value || '')}
                height="100%"
              />
            </div>

            {/* Download Button */}
            <div className="bg-dark-sidebar border-t border-dark-border px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {activeFile.content.length} characters • {activeFile.content.split('\n').length} lines
              </span>
              <motion.button
                onClick={handleDownloadCode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Download</span>
              </motion.button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="w-full lg:w-1/2 flex flex-col bg-white">
            {/* Output Tab Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPreview(true)}
                  className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                    showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                    !showPreview ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Console
                </button>
              </div>
              {consoleOutput.length > 0 && !showPreview && (
                <button
                  onClick={() => setConsoleOutput([])}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <XIcon className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-hidden relative">
              {showPreview && (activeFile.language === 'html' || activeFile.language === 'css') ? (
                <iframe
                  srcDoc={output}
                  title="Preview"
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full border-0"
                />
              ) : (
                <div 
                  ref={consoleRef}
                  className="absolute inset-0 overflow-y-auto p-4 font-mono text-sm bg-slate-50"
                >
                  {consoleOutput.length > 0 ? (
                    consoleOutput.map((line, index) => (
                      <div 
                        key={index} 
                        className={`py-1 ${
                          line.startsWith('❌') ? 'text-red-600' : 
                          line.startsWith('ℹ️') ? 'text-blue-600' :
                          line.startsWith('💡') ? 'text-amber-600' :
                          'text-slate-700'
                        }`}
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic">
                      Console output will appear here...
                      <div className="mt-2 text-xs">
                        • Click "Run Code" to execute
                        • console.log() will show here
                        • Errors will be displayed in red
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
          </motion.div>
        )}

        {/* Electrical IDE */}
        {activeIDE === 'circuit' && (
          <motion.div
            key="circuit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <ElectricalIDE />
          </motion.div>
        )}

        {/* Mechanical IDE */}
        {activeIDE === 'beam' && (
          <motion.div
            key="beam"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <MechanicalIDE />
          </motion.div>
        )}

        {/* Civil IDE */}
        {activeIDE === 'structural' && (
          <motion.div
            key="structural"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <CivilIDE />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IDE;
