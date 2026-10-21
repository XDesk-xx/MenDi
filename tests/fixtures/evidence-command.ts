const mode = process.argv[2];
if (mode === 'quiet') process.stderr.write('actual stderr\n');
else process.stdout.write('deterministic evidence output\n'.repeat(128));
if (mode === 'failed') process.exitCode = 7;
