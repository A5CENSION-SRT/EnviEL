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

  /// Returns a debug message string for UI display
  static Future<String> sendPlaybackEvent(
    PlaybackEvent event,
    String serverUrl,
  ) async {
    final payload = json.encode(event.toJson());
    final targetUrl = '$serverUrl/api/audio-events';
    print('[EnviEL DEBUG] ============================');
    print('[EnviEL DEBUG] Sending POST to: $targetUrl');
    print('[EnviEL DEBUG] Payload: $payload');
    try {
      final url = Uri.parse(targetUrl);
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: payload,
          )
          .timeout(Duration(seconds: 5));
      final msg = 'POST ${response.statusCode} → $targetUrl';
      print('[EnviEL DEBUG] Response: ${response.statusCode} ${response.body}');
      print('[EnviEL DEBUG] ============================');
      return '✅ $msg';
    } catch (e) {
      final msg = '❌ FAILED → $targetUrl\n$e';
      print('[EnviEL DEBUG] ERROR: $e');
      print('[EnviEL DEBUG] ============================');
      return msg;
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
