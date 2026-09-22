# My smol stack based VM

Open `index.html` in your browser to run it.
I only tested it on firefox.

Here is a fibbonacci sequence generator example:
```asm
push 0
push 1
push 1
print
over
add
dup
dup
push 230
gt
push 3
jt
```


Open browser console and press `run` button in `index.html`. It will print fibbonacci numbers less then 230.

Asm parser does not have comments, empty lines, or labels and is pretty bad. (to be developed)
But it works.
