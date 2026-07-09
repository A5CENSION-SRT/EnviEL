import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _serverUrlKey = 'server_url';
  static const String _lastCategoryKey = 'last_category';

  static Future<bool> saveServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.setString(_serverUrlKey, url);
  }

  static Future<String?> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_serverUrlKey);
  }

  static Future<bool> clearServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.remove(_serverUrlKey);
  }

  static Future<bool> saveLastCategory(String category) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.setString(_lastCategoryKey, category);
  }

  static Future<String> getLastCategory() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_lastCategoryKey) ?? 'gunshot';
  }
}
