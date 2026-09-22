let _auto_var = 0

const auto = () => {
    return _auto_var++;
}

const auto_reset = () => {
    _auto_var = 0;
}
    
const OpType = Object({
    PUSH: auto(),
    POP: auto(),

    ADD: auto(),
    SUB: auto(),
    MUL: auto(),
    DIV: auto(),
    JMP: auto(),
    JGT: auto(),
    JLT: auto(),
    JEQ: auto(),
    PRINT: auto(),
    HALT: auto(),
});
auto_reset();

class Stack {
    values;

    constructor() {
	this.values = [];
    }

    push(value) { this.values.push(value); }

    pop(value) {
	if (vm.stack.length() === 0) {
	    throw "ERROR: Stack is empty! nothing to pop!";
	}

	return this.values.pop(value);
    }

    top() {
	if (vm.stack.length() === 0) {
	    throw "ERROR: Stack is empty!";
	}

	return this.values[this.values.length-1];
    }

    length() {
	return this.values.length;
    }
    toString() {
	// works for now
	let representation = `Stack(`;
	for (let i = 0; i < this.length(); i++) {
	    if (i > 5) { representation += '...'; break }
	    representation += `${this.values[i]},`;
	}
	representation += ')';
	return representation;
    }
}

class Op {
    // Instruction/Operation constructor

    type; // OpType
    operand; // double | None

    constructor(type, value) {
	this.type = type;
	this.operand = value;
    }
    
    static Push(value) { return new Op(OpType.PUSH, value); }
    static Pop() { return new Op(OpType.POP, null); }
    static Add() { return new Op(OpType.ADD, null); }
    static Sub() { return new Op(OpType.SUB, null); }
    static Mul() { return new Op(OpType.MUL, null); }
    static Div() { return new Op(OpType.DIV, null); }
    static Jmp() { return new Op(OpType.JMP, null); }
    static Jgt() { return new Op(OpType.JGT, null); }
    static Jlt() { return new Op(OpType.JLT, null); }
    static Jeq() { return new Op(OpType.JEQ, null); }
    static Print() { return new Op(OpType.PRINT, null); }

    toString() { return `OpType(${this.type}, ${this.operand})` }
}


class VM {
    // Our Virtual Machine

    program; // This is where we load our byte code 
    stack;   // This is where we store values. Afaik we can use just the stack without the program, but my brain does not brain rn
    // We would basically need to pop the inscturction, then execute/interpret it as we do it now. or maybe not
    ip; // a.k.a program counter

    constructor(program) {
	this.program = [];
	this.stack = new Stack();
	this.ip = 0; // Do I even need ip? Is stack_top enough?
    }
    
    run() {
	if (!this.program) {
	    throw "ERROR: No instructions; Program is empty or does not exist."
	}

	// execute instructions here ...
	for (;this.ip < this.program.length;) {
	    console.log("Running instruction: ", this.program[this.ip]);
	    interpret(this.program[this.ip++]);
	}
    }

    debug_print() {
	console.log("VM stack: ", String(vm.stack), "VM stack size: ", vm.stack.length(),  "Stack top: ", vm.stack.top());
    }
}

let vm = new VM();

const interpret = (instruction) => {
    if (vm.ip > vm.program.length) {
	throw "ERROR: Instruction pointer is out of bounds.", vm.ip
    }
    if (!instruction) {
	throw "ERROR: Could not load instruction";
    }
    switch (instruction.type) {
    case OpType.PUSH:
	vm.stack.push(instruction.operand);
	console.log("In interpret(OpType.PUSH): ", vm.stack);
	// we don't increment ip here since vm does it
	break;
    case OpType.POP:
	vm.stack.pop();
	break;
    case OpType.ADD:
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() + vm.stack.top();
	console.log(vm.stack);
	break;
    case OpType.SUB:
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() - vm.stack.top();
	console.log(vm.stack);
	break;
    case OpType.MUL:
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() + vm.stack.top();
	console.log(vm.stack);
	break;
    case OpType.DIV:
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() / vm.stack.top();
	console.log(vm.stack);
	break;
    case OpType.JMP:
	vm.ip = vm.stack.pop();
	break;
    case OpType.JGT:
	// if top of the stack is greater then second element,
	// then: jump to an address located in the third element.

	if (vm.stack.length() < 3) {
	    throw "ERROR: JGT takes 3 arguments, stack is too small!"
	}
 	// Should we consume arguments? Probably yeah
	let left = vm.stack.pop();
	let right = vm.stack.pop(); // values[vm.stack.length()-2]
	let target = vm.stack.pop(); //values[vm.stack.length()-3]

	console.log(left, right, target);

	if (left > right) {
	    console.log("left is greater than right 😭");
	    vm.ip = target;
	}

	break;
    case OpType.PRINT:
	if (vm.stack.length() === 0) {
	    throw "ERROR: Stack is empty! Nothing to print.";
	}

	console.log(vm.stack.top());
	break;
    default:
	console.log(vm.stack);
	throw `ERROR: Illegal inscturction: ${instruction.type}`;
    }
}

const emitOp = (Op) => {
    vm.program.push(Op);
}    

const parseValue = (value_string) => {
    // TODO: parse this in some better way idk.
    return Number(value_string); 
}

const parseAsm = (input) => {
    let result;

    let line;
    let line_counter;
    let symbol_counter;

    const check_number_of_operands = (op_name, num_operands) => {
	if (line.length > num_operands + 1 ) {
	    console.log(line, line.length, num_operands);
	    throw `ERROR(${line_counter}:${symbol_counter}): '${op_name}' takes only ${num_operands} argument(s)`;
	}
    }

    if (!input) {
	let message = "Program input is empty!"
	alert(message);
	throw message;
    }
    lines = input.split('\n');
    console.log("Progam text split by lines: ");
    for (line_counter = 0; line_counter < lines.length; line_counter++ ) { 
	line = lines[line_counter].trim().split(' ');

	// We do reset a symbol after parsing a line.
	symbol_counter = 0;  // TODO: think about this later
	let symbol = line[symbol_counter];

	console.log(line);
	
	switch(symbol) {
	case "push":
	    check_number_of_operands("PUSH", 1)
	    // parse argument
	    symbol_counter += 1;
	    let operand = parseValue(line[symbol_counter]);
	    emitOp(Op.Push(operand))
	    break;
	case "pop":      emtiOp(op.Pop()); break; 
	case "add":      emitOp(Op.Add()); break;
	case "sub":      emitOp(Op.Sub()); break;
	case "mul":      emitOp(Op.Mul()); break;
	case "div":      emitOp(Op.Div()); break;
	case "jmp":      emitOp(Op.Jmp()); break;
	case "jgt":      emitOp(Op.Jgt()); break;
	case "jlt":      emitOp(Op.Jlt()); break;
	case "jeq":      emitOp(Op.Jeq()); break;
	case "print":    emitOp(Op.Print()); break;
	default:
	    throw `ERROR: Unknown instruction at (line:sybmol) ${line_counter}:${symbol_counter} : ${symbol}`;
	}
    }

    return result;
}

const main = (input) => {
    console.log(String(vm.program));
    parseAsm(input); // This pushes asm straight into vm.
    vm.program;
    vm.run();
}

