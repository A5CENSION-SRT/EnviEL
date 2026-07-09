import 'package:just_audio/just_audio.dart';

class AudioPlayerService {
  late AudioPlayer _audioPlayer;
  bool _isInitialized = false;

  AudioPlayerService() {
    _initialize();
  }

  void _initialize() {
    _audioPlayer = AudioPlayer();
    _isInitialized = true;
  }

  Future<void> load(String url) async {
    if (!_isInitialized) _initialize();
    try {
      await _audioPlayer.setUrl(url);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> play() async {
    await _audioPlayer.play();
  }

  Future<void> pause() async {
    await _audioPlayer.pause();
  }

  Future<void> stop() async {
    await _audioPlayer.stop();
  }

  Future<void> dispose() async {
    await _audioPlayer.dispose();
  }

  Future<void> seekTo(Duration position) async {
    await _audioPlayer.seek(position);
  }

  bool get isPlaying => _audioPlayer.playing;

  Stream<Duration?> get positionStream => _audioPlayer.positionStream;

  Stream<PlayerState> get playerStateStream => _audioPlayer.playerStateStream;

  Future<Duration?> getDuration() async {
    return _audioPlayer.duration;
  }
}
