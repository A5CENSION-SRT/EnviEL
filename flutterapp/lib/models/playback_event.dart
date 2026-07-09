class PlaybackEvent {
  final String fileName;
  final String audioType;
  final int duration;
  final int timestamp;

  PlaybackEvent({
    required this.fileName,
    required this.audioType,
    required this.duration,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'fileName': fileName,
        'audioType': audioType,
        'duration': duration,
        'timestamp': timestamp,
      };
}
