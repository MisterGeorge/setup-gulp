import fs from 'fs';
import path from 'path';

test('valida la existencia de archivos en la carpeta scss', () => {
  const scssDirectory = './src/scss';
  const filesToCheck = ['_colors.scss', '_fonts.scss', '_mixins.scss', '_functions.scss', '_variables.scss'];

  filesToCheck.forEach((file) => {
    const filePath = path.join(scssDirectory, file);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
