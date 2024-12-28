import './App.css'
import MonacoEditor from '@monaco-editor/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useRef, useState } from 'react';
import { BFInterpreter } from './bf';
import { IPosition } from 'monaco-editor';
import { TextField } from '@mui/material';

function App() {
  const initialRef: any = null;
  const editorRef = useRef(initialRef);
  const monacoRef = useRef(initialRef);
  const outputTheme = createTheme({
    typography: {
      fontFamily: [
        'Consolas, Courier New',
      ].join(','),
    },
  });

  const [output, setOutput] = useState("");
  const [stepping, setStepping] = useState(false);
  const [waitingOnInput, setWaitingOnInput] = useState(false);
  const [input, setInput] = useState("");
  const decorations = useRef(initialRef);

  const bf = useRef(new BFInterpreter(""));
  const [nodes, setNodes] = useState(bf.current.getNodes());
  
  function HandleEditorDidMount(editor : any, monaco : any) {
    editorRef.current = editor;
    monacoRef.current = monaco;

  }

  function HandleEditorWillMount(monaco : any) {
    monaco.languages.register({id: 'bf'});
    monaco.languages.setMonarchTokensProvider('bf',{
      defaultToken: "",
      
      tokenizer: {
        root: [
          [/[+-]+/, "arith"],
          [/[<>]+/, "array"],
          [/[,.]+/, "io"],
          [/[\[\]]+/, "bracket"],
        ]
      }
    });
    
    monaco.editor.defineTheme('bf-theme', {
      "base": "vs-dark",
      "inherit": true,
      "rules": [
          {token: 'arith', foreground: '5ed4f2', weight: 'bold'},
          {token: 'array', foreground: '5ef294', weight: 'bold'},
          {token: 'io', foreground: 'f2725e', weight: 'bold'},
          {token: 'bracket', foreground: 'fcf121', weight: 'bold'},
      ],
      "colors": {
        "editor.foreground": "#f5f5f5",
        "editor.background": "#16181a",
        "editor.selectionBackground": "#454c52",
        "editor.lineHighlightBackground": "#333232",
        "editorCursor.foreground": "#f5f5f5",
        "editorWhitespace.foreground": "#16181a"
      }
    });

    
  }

  function runBF() {
    bf.current = new BFInterpreter("");
    editorRef.current.updateOptions({ readOnly: true });
    if(editorRef.current != null) {
      setStepping(false);
      bf.current.setCode(editorRef.current.getValue());
      bf.current.interpret();
      setOutput(bf.current.getOutput());
      setNodes(bf.current.getNodes());
      if(!bf.current.interrupted()) {
        editorRef.current.updateOptions({ readOnly: false });
      } else if(bf.current.interrupted()) {
        setWaitingOnInput(true);
      }
      if(decorations.current) {
        decorations.current.clear();
      }
    }
  }

  function stepBF() {
    if(editorRef.current != null) {
      editorRef.current.updateOptions({ readOnly: true });
      setStepping(true);
      bf.current.setCode(editorRef.current.getValue());
      if(decorations.current) {
        decorations.current.clear();
      }
      bf.current.interpreterStep(); 
      let position = bf.current.getCurrentPosition();
      let iposition: IPosition = editorRef.current.getModel().getPositionAt(position);
      decorations.current = (editorRef.current.createDecorationsCollection([
        {
          range: new monacoRef.current.Range(iposition.lineNumber, iposition.column, iposition.lineNumber, iposition.column + 1),
          options: { inlineClassName: "textHL" },
        },
      ]));
      if(bf.current.interrupted()) {
        setWaitingOnInput(true);
      }

      if(bf.current.getDone()) {
        setStepping(false);
        editorRef.current.updateOptions({ readOnly: false });
      }
      setOutput(bf.current.getOutput());
      setNodes(bf.current.getNodes());
    }
  }

  function resetBF() {
    setOutput("");
    setWaitingOnInput(false);
    editorRef.current.updateOptions({ readOnly: false });
    bf.current = new BFInterpreter("");
    if(decorations.current) {
      decorations.current.clear();
    }
    setNodes(bf.current.getNodes());
  }

  function sendInput() {
    bf.current.addInput(input);
    setWaitingOnInput(false);
    if(stepping) {
      stepBF();
    }
    else {
      editorRef.current.updateOptions({ readOnly: true });
      bf.current.interpret();
      setOutput(bf.current.getOutput());
      if(!bf.current.interrupted()) {
        editorRef.current.updateOptions({ readOnly: false });
      } else if(bf.current.interrupted()) {
        setWaitingOnInput(true);
      }
      if(decorations.current) {
        decorations.current.clear();
      }
    }
  }

  return (
    <>
      <h1>
        BonaFIDE Brainf**k Debugger!
      </h1>

      <p><a href="https://esolangs.org/wiki/Brainfuck"><b>Brainf**k</b></a> is a minimalistic programming language developed
      by Urban Müller in 1993. It's insanely easy to learn, but also insanely difficult to master. With only 8 total commands
      in the language and a compiler that was originally only 240 bytes, brainf**k is Turing complete, meaning it's as capable
      as any other programming language at performing calculations. <s>The obvious conclusion is that brainf**k should render
      JavaScript obsolete.</s></p>

      <p>Feel free to try the language out by using the provided code editor! :)</p>
      
      <Box  sx={{ boxShadow: 4, marginBottom: '2vh'}} >
        <MonacoEditor 
          height="60vh" 
          width="100%" 
          theme="bf-theme"
          defaultValue=">++++++++[<+++++++++>-]<.>++++[<+++++++>-]<+.+++++++..+++.>>++++++[<+++++++>-]<+
          +.------------.>++++++[<+++++++++>-]<+.<.+++.------.--------.>>>++++[<++++++++>-
          ]<+."
          language='bf'
          onMount={HandleEditorDidMount}
          beforeMount={HandleEditorWillMount}
          options={{fontSize: 20}}
        />
    </Box>

    <Stack spacing={2} direction="row">
      <Button variant="contained" onClick={runBF} disabled={waitingOnInput}>Run</Button>
      <Button variant="contained" onClick={stepBF} disabled={waitingOnInput}>Step</Button>
      <Button variant="contained" onClick={resetBF}>Reset</Button>
    </Stack>
      
    <hr></hr>
    <h2><u>MEMORY</u></h2>
    The cell currently pointed to has a <b style={{color: "green"}}>green</b> outline. The initial cell 0 has a <b style={{color: "blue"}}>blue</b> outline.
    <Stack spacing={1} direction="row" sx={{justifyContent: 'center', flexWrap: 'wrap'}} 
      useFlexGap>
      { nodes.map((node) => {

        if(node == null) {
          return;
        }
        let color = 'grey';
        if(bf.current.getCenterNode() == node) {
          color = 'blue';
        }
        if(bf.current.getCurrentNode() == node) {
          color = 'green';
        }
        return(
          <Box component="section" sx={{ p: 2, border: '4px solid ' + color, boxShadow: 4, width: 36, height: 36, }}>
          <Box component="section" sx={{fontWeight: "bold", fontSize: "16pt", display: 'flex', justifyContent: 'center', alignItems: 'top',}}>
            {node.data}
          </Box>
          <Box component="section" sx={{display: 'flex', justifyContent: 'center'}}>
            "{String.fromCharCode(node.data)}"
          </Box>
        </Box>
        )
        })
      }
    </Stack>

    <hr></hr>

    <ThemeProvider theme={outputTheme}>
      <h2><u>OUTPUT</u></h2>
      <Box sx={{fontFamily: "Consolas, Courier New", fontWeight: 'bold', marginTop: '2vh', backgroundColor: '#d4d4d4', boxShadow: 4}}>
        {output.split("\n").map(str => <p>{str}</p>)}
      </Box>
      <h2><u>INPUT</u></h2>
      <Stack spacing={2} direction="row">
        <TextField id="input" label="Input" variant="outlined" value={input} disabled={!waitingOnInput}
          onChange={(e) => {
            setInput(e.target.value);
          }}/>
        <Button variant="contained" onClick={sendInput} disabled={!waitingOnInput}>Send</Button>
      </Stack>
    </ThemeProvider>
    
    <p>Made by <a href="https://truttle1.xyz">Truttle1</a>.</p>
    <p>The text editor is the <a href="https://microsoft.github.io/monaco-editor/">Monaco editor</a>.</p>

    </>
  )
}

export default App
