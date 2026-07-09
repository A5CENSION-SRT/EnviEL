import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/audio_file.dart';
import '../models/playback_event.dart';

class ApiService {
  static Future<List<AudioFile>> getAudioFiles(
    String type,
    String serverUrl,
  ) async {
    try {
      final url = Uri.parse('$serverUrl/api/audio-files?type=$type');
      final response = await http.get(url).timeout(
            Duration(seconds: 10),
            onTimeout: () => http.Response('timeout', 500),
          );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((file) => AudioFile.fromJson(file)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<void> sendPlaybackEvent(
    PlaybackEvent event,
    String serverUrl,
  ) async {
    try {
      final url = Uri.parse('$serverUrl/api/audio-events');
      await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode(event.toJson()),
          )
          .timeout(Duration(seconds: 5));
    } catch (e) {
      // Fail silently
    }
  }

  static Future<bool> testConnection(String serverUrl) async {
    try {
      final url = Uri.parse('$serverUrl/api/audio-events');
      final response = await http.get(url).timeout(Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
