import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const DIST_PATH = path.join(__dirname, '../dist');
const OUTPUT_ZIP_PATH = path.join(DIST_PATH, 'backend.zip');

// Create a file to stream archive data to.
const output = fs.createWriteStream(OUTPUT_ZIP_PATH);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

// This event is fired when the data source is drained no matter what was sent.
// 'end' event is fired when the stream finishes piping their data.
archive.on('end', function() {
  console.log('Data has been drained');
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    // log warning
    console.warn(err);
  } else {
    // throw error
    throw err;
  }
});

// good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// pipe archive data to the file
archive.pipe(output);

// append files from a directory, putting its contents at the root of the archive
archive.directory(DIST_PATH, false);

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();
