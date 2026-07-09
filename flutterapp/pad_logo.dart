import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final file = File('VLC-Logo-2001-2479259485.png');
  if (!file.existsSync()) {
    print('Error: Original logo file not found.');
    return;
  }
  final bytes = file.readAsBytesSync();
  final image = img.decodeImage(bytes);
  if (image == null) {
    print('Error: Could not decode image.');
    return;
  }

  final width = image.width;
  final height = image.height;
  final size = width > height ? width : height;

  final dstX = (size - width) ~/ 2;
  final dstY = (size - height) ~/ 2;

  // Create a new black background square image (black fits the dark VLC theme best)
  // Or transparent (numChannels: 4)
  final square = img.Image(width: size, height: size, numChannels: 4);
  
  // Fill background with transparent (all 0s)
  square.clear(img.ColorRgba8(0, 0, 0, 0));

  // Copy original image into the center
  img.compositeImage(square, image, dstX: dstX, dstY: dstY);

  final pngBytes = img.encodePng(square);
  File('VLC-Logo-Square.png').writeAsBytesSync(pngBytes);
  print('Successfully generated VLC-Logo-Square.png!');
}
