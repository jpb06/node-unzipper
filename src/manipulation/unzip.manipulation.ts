import * as fs from 'fs-extra';
import * as yauzl from 'yauzl';
import { Readable } from "stream";

import { UnzipResult } from "../types/unzipper.types";


export async function unzip(
    zipFilePath: string,
    destPath: string
): Promise<UnzipResult> {

    return new Promise<UnzipResult>((resolve, reject) => {

        yauzl.open(zipFilePath, { lazyEntries: true }, (err?: Error, zipfile?: yauzl.ZipFile) => {

            if (err) reject({ result: false, error: err.message });
            if (!zipfile) reject({ result: false, error: "No zip file" });
            else {
                zipfile.readEntry();

                zipfile.on('entry', (entry: yauzl.Entry) => {
                    if (/\/$/.test(entry.fileName)) {
                        // Directory file names end with '/'.
                        zipfile.readEntry();
                    } else {
                        // file entry
                        zipfile.openReadStream(entry, (entryReadingErr?: Error, readStream?: Readable) => {
                            if (entryReadingErr) reject({ result: false, error: entryReadingErr.message });
                            if (!readStream) reject({ result: false, error: `No read stream for ${entry.fileName}` });
                            else {
                                readStream.on("end", function () {
                                    zipfile.readEntry();
                                });
                                var myFile = fs.createWriteStream(`${destPath}/${entry.fileName}`);
                                readStream.pipe(myFile);
                            }
                        });
                    }

                    zipfile.readEntry();

                });
                //zipfile.on('end', () => {
                //    console.log('end of unzip');
                //});
                zipfile.once('close', () => {
                    resolve({ result: true, error: '' });
                });
            }
        });
    });
}