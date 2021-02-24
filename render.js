"use strict";

// Change these parameters to adjust the result.
const startMove = 0;
const endMove = 1000;
const movesPerFrame = 10;
const renderer = "C:\\Program Files\\POV-Ray\\v3.7\\bin\\pvengine64";

const { spawn } = require("child_process");
const fs = require("fs");

fs.rmSync("output", { recursive: true });

const board = Array(19);

for (let x = 0; x < 19; x++)
{
	board[x] = Array(19);
}

const sgf = fs.readFileSync(process.argv[2], { encoding: "utf-8" });
const moves = sgf.toUpperCase().match(/[BW]\[\w{2}\]/g).map(m => [m.charAt(0), m.charCodeAt(2) - 65, m.charCodeAt(3) - 65]);
let scene = `#declare Stones = array[${moves.length + 1}][19][19]\n#declare Nudges = array[${moves.length + 1}][19][19]\n`;
scene += getScene(0);

for (let i = 0; i < moves.length; i++)
{
	play(...moves[i]);
	scene += getScene(i + 1);
}

fs.writeFileSync("stones.inc", scene);

let ini =
`Input_File_Name = goban.pov\n` +
`Output_File_Name = output\\\n` +
`Initial_Frame = 0\n` +
`Final_Frame = ${moves.length}\n` +
`Subset_Start_Frame = ${startMove}\n` +
`Subset_End_Frame = ${Math.min(endMove, moves.length)}\n` +
`Frame_Step = ${movesPerFrame}\n`;

fs.writeFileSync("goban.ini", ini);

fs.mkdirSync("output");

spawn(renderer, ["/RENDER", "goban.ini"]);

function play(c, x, y)
{
	const [nx, ny] = boxMuller(1);
	board[x][y] = { c: c, x: nx, y: ny };

	checkCapture(x - 1, y);
	checkCapture(x + 1, y);
	checkCapture(x, y - 1);
	checkCapture(x, y + 1);
}

function checkCapture(x, y)
{
	if (x < 0 || x >= 19 || y < 0 || y >= 19 || board[x][y] === undefined)
		return;

	const group = new Set();

	if (checkCaptureRec(group, board[x][y].c, x, y))
	{
		for (const xy of group)
		{
			const [x, y] = xy.split(",");
			board[Number(x)][Number(y)] = undefined;
		}
	}
}

function checkCaptureRec(group, c, x, y)
{
	if (x < 0 || x >= 19 || y < 0 || y >= 19)
		return true;

	if (group.has(x + "," + y))
		return true;

	if (board[x][y] === undefined)
		return false;

	if (board[x][y].c !== c)
		return true;

	group.add(x + "," + y);

	return checkCaptureRec(group, c, x - 1, y) && checkCaptureRec(group, c, x + 1, y) && checkCaptureRec(group, c, x, y - 1) && checkCaptureRec(group, c, x, y + 1);
}

function boxMuller(stddev)
{
	const a = Math.random();
	const b = Math.random();
	const r = Math.sqrt(-2 * Math.log(a)) * stddev;
	const theta = 2 * Math.PI * b;
	return [r * Math.cos(theta), r * Math.sin(theta)];
}

function getScene(move)
{
	let scene = "";
	for (let x = 0; x < 19; x++)
	{
		for (let y = 0; y < 19; y++)
		{
			const stone = board[x][y];
			if (stone)
			{
				scene += `#declare Stones[${move}][${x}][${y}] = ${stone.c};\n#declare Nudges[${move}][${x}][${y}] = <${stone.x}, 0, ${stone.y}>;\n`;
			}
		}
	}
	return scene;
}