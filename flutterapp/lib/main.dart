import 'package:flutter/material.dart';
import 'screens/player_screen.dart';
import 'screens/settings_screen.dart';
import 'services/storage_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String serverUrl = 'http://10.162.31.160:3000';
  bool isPlayerScreen = true;

  @override
  void initState() {
    super.initState();
    _loadServerUrl();
  }

  Future<void> _loadServerUrl() async {
    final url = await StorageService.getServerUrl();
    setState(() {
      if (url != null && url != 'http://192.168.1.100:3000' && url.isNotEmpty) {
        serverUrl = url;
      } else {
        serverUrl = 'http://10.162.31.160:3000';
      }
    });
  }

  void _onServerUrlSaved(String url) {
    setState(() {
      serverUrl = url;
      isPlayerScreen = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VLC',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Colors.orange,
        scaffoldBackgroundColor: const Color(0xFF1a1a1a),
        useMaterial3: true,
      ),
      home: isPlayerScreen
          ? PlayerScreen(
              serverUrl: serverUrl,
              onSettingsPress: () {
                setState(() => isPlayerScreen = false);
              },
            )
          : SettingsScreen(
              initialUrl: serverUrl,
              onSave: _onServerUrlSaved,
              onCancel: () {
                setState(() => isPlayerScreen = true);
              },
            ),
      debugShowCheckedModeBanner: false,
    );
  }
}
