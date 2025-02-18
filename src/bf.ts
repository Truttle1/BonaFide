class DataNode {
    public left: DataNode | null = null;
    public right: DataNode | null = null;
    public data : number = 0;
    public id: number;
    constructor(data: number, id: number = 0) {
        this.data = data;
        this.id = id;
    }
}

export class BFInterpreter {
    private code: string = "";
    private pointer: DataNode = new DataNode(0, 0);
    private dataNodeId = 1;
    private loopStack: Array<number> = [];
    private codePointer: number = 0;
    private inputBuffer: string = "";
    private output: string = "";
    private needsMoreInput: boolean = false;
    private leftMostNode: DataNode = this.pointer;
    private centerNode: DataNode = this.pointer;

    constructor(code: string) {
        this.code = code;
    }

    printCode() {
        console.log(this.code);
    }
    
    getOutput() {
        return this.output;
    }

    addInput(input: string) {
        this.inputBuffer += input;
        this.needsMoreInput = false;
    }

    setCode(code: string) {
        this.code = code;
    }

    interpreterStep() {
        switch(this.code[this.codePointer]) {
            case '+': {
                this.pointer.data += 1;
                if (this.pointer.data >= 256) {
                    this.pointer.data -= 256;
                }
                break;
            }
            case '-': {
                this.pointer.data -= 1;
                if (this.pointer.data < 0) {
                    this.pointer.data += 256;
                }
                break;
            }
            case '>': {
                if(this.pointer.right == null) {
                    let newNode = new DataNode(0, this.dataNodeId);
                    this.dataNodeId += 1;
                    newNode.left = this.pointer;
                    this.pointer.right = newNode;
                } 
                this.pointer = this.pointer.right;
                break;
            }
            case '<': {
                if(this.pointer.left == null) {
                    let newNode = new DataNode(0, this.dataNodeId);
                    this.dataNodeId += 1;
                    newNode.right = this.pointer;
                    this.pointer.left = newNode;
                    if(this.pointer == this.leftMostNode) {
                        this.leftMostNode = newNode;
                    }
                } 
                
                this.pointer = this.pointer.left;

                break;
            }
            case '[': {
                if(this.pointer.data == 0) {
                    let x = 0;
                    do {
                        if(this.code[this.codePointer] == '[') {
                            x += 1;
                        }
                        else if(this.code[this.codePointer] == ']') {
                            x -= 1;
                        }
                        this.codePointer += 1
                    }
                    while(x > 0  && this.codePointer <= this.code.length) 
                    this.codePointer -= 1;
                }
                else {
                    this.loopStack.push(this.codePointer);
                }
                break;
            }
            case ']': {
                let destination = this.loopStack.pop();

                if(destination != null ){
                    if(this.pointer.data != 0) {
                        this.codePointer = destination - 1;
                    }
                }
                break;
            }
            case '.': {
                this.output += String.fromCharCode(this.pointer.data);
                break;
            }
            case ',': {
                if(this.inputBuffer.length <= 0) {
                    this.needsMoreInput = true;
                    return;
                }
                this.pointer.data = this.inputBuffer.charCodeAt(0) % 256;
                this.inputBuffer = this.inputBuffer.substring(1);
                break;
            }
        }

        this.codePointer += 1;
    }

    interpret() {
        while(this.codePointer < this.code.length && !this.needsMoreInput) {
            this.interpreterStep();
        }

        if(this.codePointer == this.code.length) {
            this.codePointer = 0;
        }
    }

    interrupted() {
        return this.needsMoreInput;
    }

    getCurrentPosition() {
        return this.codePointer;
    }

    getDone() {
        return this.codePointer >= this.code.length;
    }

    getLeftMostNode() {
        return this.leftMostNode;
    }

    getCenterNode() {
        return this.centerNode;
    }

    getCurrentNode() {
        return this.pointer;
    }

    getNodes() {
        let node: DataNode | null = this.leftMostNode;
        let result: Array<DataNode> = [];
        while(node != null) {
            result.push(node);
            node = node.right;
        }
        return result;
    }

    getArrayIndex() {
        let node: DataNode | null = this.leftMostNode;
        let result: number = 0;
        while(node != null) {
            if(node == this.pointer) {
                return result;
            }
            node = node.right;
            result += 1;
        }
        return -1;
    }
}