let _auto_var = 0

const auto = () => {
    return _auto_var++;
}

const auto_reset = () => {
    _auto_var = 0;
}
    
const OpType = {
    PUSH: auto(),  POP: auto(),
    OVER: auto(), SWP: auto(), DUP: auto(),

    ADD: auto(),   SUB: auto(),
    MUL: auto(),   DIV: auto(),

    GT: auto(),
    LT: auto(),
    EQ: auto(),

    JMP: auto(),
    JT: auto(),   JF: auto(),

    PRINT: auto(),
    NOP: auto(),
};
auto_reset();

class Stack {
    values;

    constructor() {
	this.values = [];
    }

    push(value) { this.values.push(value); }

    pop(value) {
	if (this.length() === 0) {
	    throw "ERROR: Stack is empty! nothing to pop!";
	}

	return this.values.pop(value);
    }

    top() {
	if (this.values.length < 0) {
	    throw "ERROR: Stack is empty! ip = " + vm.ip;
	}

	return this.values[this.values.length-1];
    }

    length() {
	return this.values.length;
    }

    set_top(value) {
	this.values[this.length()-1] = value;
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

class Queue extends Stack {
    get() {
	/* Get element from the queue */
	return this.values.shift();
    }

    ready() {
	return !(this.values.length === 0);
    }

    toString() {
	// works for now. I don't know how to just get the name of the class
	let representation = `Queue(`;
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
    operand; // double | None  /// Damn most instructions don't even use this but oh well

    constructor(type, value) {
	this.type = type;
	this.operand = value;
    }

    static Push(value) { return new Op(OpType.PUSH, value); }
    static Pop() { return new Op(OpType.POP, null); }
    static Swp() { return new Op(OpType.SWP, null); }
    static Over() { return new Op(OpType.OVER, null); }
    static Dup() { return new Op(OpType.DUP, null); }

    static Add() { return new Op(OpType.ADD, null); }
    static Sub() { return new Op(OpType.SUB, null); }
    static Mul() { return new Op(OpType.MUL, null); }
    static Div() { return new Op(OpType.DIV, null); }

// Comparison
    static Gt() { return new Op(OpType.GT, null); }
    static Lt() { return new Op(OpType.LT, null); }
    static Eq() { return new Op(OpType.EQ, null); }
    
    // ---
    // jump family inscturction. These are awkward except for jmp
    static Jmp() { return new Op(OpType.JMP, null); }
    static Jt() { return new Op(OpType.JT, null); } // Jump if value on the stack is truthy
    static Jf() { return new Op(OpType.JF, null); } // Jump falsey!
    // ---

    static Print() { return new Op(OpType.PRINT, null); }
    static Nop() { return new Op(OpType.NOP, null); }

    toString() { return `OpType(${this.type}, ${this.operand})` }
}

class VM {
    // Our Virtual Machine

    program; // This is where we load our byte code 
    stack;   // This is where we store values. 
    ip; // a.k.a program counter
    output; /* (Queue) This is where we write things to.
             * I don't want to just print somewhere from this vm, but instead
	     * be able to get it from whereever I want to, and having a queue
	     * seems like an okay way to do it
	     */

    constructor() {
	this.program = [];
	this.stack = new Stack();
	this.ip = 0; // Do I even need ip? Is stack_top enough?
	this.output = new Queue();
    }

    // rest VM itself
    reset() {
	this.program = []
	this.stack = new Stack();
	this.ip = 0;
	this.output = new Queue();
    }	
    
    set_ip(value) {
	if (value >= this.program.length || value < 0) {
	    throw "ERROR: jump to out of bounds address."
	}
	this.ip = value;
    }

    run() {
	if (!this.program) {
	    throw "ERROR: No instructions; Program is empty or does not exist."
	}

	// execute instructions here ...
	console.log("Started running ", this.program.length, "instructions total");
	for (;this.ip < this.program.length;) {
	    // console.log("Running instruction: ", dissasembleInstruction(this.program[this.ip]));
	    interpret(this.program[this.ip++]);
	}
    }

    print(arg) {
	this.output.push(arg);
    }

    debug_print() {
	console.log("VM stack: ", String(vm.stack), "VM stack size: ", vm.stack.length(),  "Stack top: ", vm.stack.top());
    }
}

const dissasembleInstruction = (op) => {
    let type;
    switch(op.type) {
    case OpType.PUSH:	type = "PUSH"; break;
    case OpType.POP:	type = "POP";  break;
    case OpType.SWP:	type = "SWP";  break;
    case OpType.OVER:	type = "OVER"; break;
    case OpType.DUP:	type = "DUP";  break;
    case OpType.ADD:	type = "ADD";  break;
    case OpType.SUB:	type = "SUB";  break;
    case OpType.MUL:	type = "MUL";  break;
    case OpType.DIV:	type = "DIV";  break;
    case OpType.GT:	type = "GT";   break;
    case OpType.LT:	type = "LT";   break;
    case OpType.EQ:	type = "EQ";   break;
    case OpType.JMP:	type = "JMP";  break;
    case OpType.JT:	type = "JT";   break;
    case OpType.JF:	type = "JF";   break;
    case OpType.PRINT:  type = "PRINT"; break;
    case OpType.NOP:    type = "NOP";  break;
    default:
	throw "ERROR: Dissasembling unkown instruction"
    }
    return `${type}`
}

const vm = new VM();

const interpret = (instruction) => {
    let left;
    let right;

    const expect_operands = (op, number) => {
	if (vm.stack.length() < number) {
	    throw `ERROR: '${op}' expects ${number} operand(s), but stack does not have enough elements on it.`
	}
    }
	

    if (vm.ip > vm.program.length) {
	throw "ERROR: Instruction pointer is out of bounds.", vm.ip
    }
    if (!instruction) {
	throw "ERROR: Could not load instruction";
    }
    switch (instruction.type) {
    case OpType.PUSH:
	vm.stack.push(instruction.operand);
	// console.log("In interpret(OpType.PUSH): ", vm.stack, vm.ip);
	// we don't increment ip here since vm does it
	break;
    case OpType.POP:
	vm.stack.pop();
	break;
    case OpType.DUP:
	vm.stack.push(vm.stack.top());
	break;
    case OpType.SWP:
	expect_operands("SWP", 2);
	left = vm.stack.pop();
	right = vm.stack.pop();
	vm.stack.push(left);
	vm.stack.push(right);
	break;
    case OpType.OVER:
	expect_operands("OVER", 3);
	left = vm.stack.pop();
	right = vm.stack.values[vm.stack.length() - 2];
	vm.stack.values[vm.stack.length() - 2] = left;
	vm.stack.push(right);
	break;
    case OpType.ADD:
	expect_operands("ADD", 2);
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() + vm.stack.top();
	break;
    case OpType.SUB:
	expect_operands("SUB", 2);
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() - vm.stack.top();
	break;
    case OpType.MUL:
	expect_operands("MUL", 2);
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() + vm.stack.top();
	break;
    case OpType.DIV:
	expect_operands("DIV", 2);
	if (vm.stack.values[vm.stack.length()-2] === 0) {
	    throw "Division by zero error."
	}
	vm.stack.values[vm.stack.length()-2] = vm.stack.pop() / vm.stack.pop();
	break;
    case OpType.JMP: // Just jump to address
	expect_operands("JMP", 1); // maybe I should not check all this stuff at runtime and move it to a parser
	vm.set_ip(vm.stack.pop());
	break;
    case OpType.JT: {
	expect_operands("JT", 1);
	const address = vm.stack.pop();
	const jumping = vm.stack.pop();
	if (jumping === 1) { // checking explicitly is prob better
	    // console.log("WERE JUMPING!!!! To:", address);
	    vm.set_ip(address);
	} else {
	    // don't jump
	}
	break;
    }
    case OpType.JF:
	expect_operands("JF", 1);

	if (vm.stack.pop() === 0) {
	    vm.set_ip(vm.stack.pop());
	} else {
	    // don't jump
	}
	break;
    case OpType.GT:
	expect_operands("GT", 2);
 	// Should we consume arguments? Probably yeah
	left = vm.stack.pop();
	right = vm.stack.top(); // values[vm.stack.length()-2]

	if (left > right) {
	    vm.stack.set_top(1);
	}  else {
	    vm.stack.set_top(0);
	}
	break;
    case OpType.LT:
	expect_operands("LT", 2);
	left = vm.stack.pop();
	right = vm.stack.top(); // values[vm.stack.length()-2]

	if (left < right) {
	    vm.stack.set_top(1);
	}  else {
	    vm.stack.set_top(0);
	}
	break;
    case OpType.EQ:
	expect_operands("EQ", 2);
	left = vm.stack.pop();
	right = vm.stack.top(); // values[vm.stack.length()-2]

	if (left === right) {
	    vm.stack.set_top(1);
	}  else {
	    vm.stack.set_top(0);
	}
	break;
    case OpType.PRINT:
	expect_operands("PRINT", 1);

	vm.print(vm.stack.top());

	break;
    case OpType.NOP:
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
    const number = Number(value_string);
    if (isNaN(number)) {
	throw "Illegal number literal";
    }
    return number;
}

const parseAsm = (input) => {
    let result;

    let line;
    let line_counter;
    let symbol;
    let symbol_counter;

    vm.reset()
    const check_number_of_operands = (op_name, num_operands) => {
	if (line.length > num_operands + 1 || line.length < num_operands + 1) {
	    console.log(line, line.length, num_operands);
	    throw `ERROR(${line_counter+1}:${symbol_counter+1}): '${op_name}' takes only ${num_operands} argument(s)`;
	}
    }

    if (!input) {
	const message = "Program input is empty!"
	alert(message);
	throw message;
    }
    lines = input.trim().split('\n');
    // need debug loggers don't have time tbh
    // console.log("Progam text split by lines: ");
    for (line_counter = 0; line_counter < lines.length; line_counter++ ) { 
	line = lines[line_counter].trim().split(' ');

	if (line[0] === "") {continue;};
	// We do reset a symbol after parsing a line.
	symbol_counter = 0;  // TODO: think about this later
	symbol = line[symbol_counter];

	// console.log(line);
	
	switch(symbol) {
	case "push": {
	    check_number_of_operands("PUSH", 1)
	    // parse argument
	    symbol_counter += 1;
	    const operand = parseValue(line[symbol_counter]);
	    emitOp(Op.Push(operand));
	    break;
	}
	case "pop":      emitOp(Op.Pop()); break; 
	case "swp":      emitOp(Op.Swp()); break;
	case "over":      emitOp(Op.Over()); break;
	case "dup":      emitOp(Op.Dup()); break;
	case "add":      emitOp(Op.Add()); break;
	case "sub":      emitOp(Op.Sub()); break;
	case "mul":      emitOp(Op.Mul()); break;
	case "div":      emitOp(Op.Div()); break;
	case "jmp":      emitOp(Op.Jmp()); break;
	case "jt":      emitOp(Op.Jt()); break;
	case "gt":      emitOp(Op.Gt()); break;
	case "lt":      emitOp(Op.Lt()); break;
	case "eq":      emitOp(Op.Eq()); break;
	case "print":    emitOp(Op.Print()); break;
	case "nop":    emitOp(Op.Nop()); break;
	default:
	    throw `ERROR(${line_counter+1}:${symbol_counter+1}): Unknown instruction: ${symbol}\n\t'${line}'`;
	}
    }

    return result;
}

const main = (input) => {
    // console.log(String(vm.program));
    parseAsm(input); // This pushes asm straight into vm and resets it.

    vm.run();
    
    let out = document.getElementById("output");

    while (vm.output.ready()) {
	out.textContent += vm.output.get() + '\n';
    }
}

