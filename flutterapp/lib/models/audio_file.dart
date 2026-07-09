class AudioFile {
  final String name;
  final String url;
  final int duration;
  final String type;
  final String timestamp;

  AudioFile({
    required this.name,
    required this.url,
    required this.duration,
    required this.type,
    required this.timestamp,
  });

  factory AudioFile.fromJson(Map<String, dynamic> json) {
    return AudioFile(
      name: json['name'] ?? '',
      url: json['url'] ?? '',
      duration: json['duration'] ?? 0,
      type: json['type'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'url': url,
        'duration': duration,
        'type': type,
        'timestamp': timestamp,
      };
}
