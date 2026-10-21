import { EvidenceSession } from '../evidence-support.ts';
const [root, directory] = process.argv.slice(2);
process.stdout.write(
  JSON.stringify(
    new EvidenceSession(directory).file({ root, ref: 'stdout.log', lifetime: 'temporary' }),
  ),
);
