import sharp from 'sharp';

async function generateIcons() {
  await sharp('public/OmniBox-Icon.png')
    .resize(192, 192)
    .toFile('public/icon-192.png');
  
  await sharp('public/OmniBox-Icon.png')
    .resize(512, 512)
    .toFile('public/icon-512.png');
    
  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
