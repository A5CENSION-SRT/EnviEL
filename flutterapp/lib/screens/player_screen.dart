import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:math';
import 'package:just_audio/just_audio.dart' hide PlaybackEvent;
import 'package:permission_handler/permission_handler.dart';
import '../models/audio_file.dart';
import '../services/audio_service.dart';
import '../services/storage_service.dart';
import '../models/playback_event.dart';
import '../services/api_service.dart';

class PlayerScreen extends StatefulWidget {
  final String serverUrl;
  final Function onSettingsPress;

  const PlayerScreen({
    Key? key,
    required this.serverUrl,
    required this.onSettingsPress,
  }) : super(key: key);

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  String currentPath = '/storage/emulated/0/Download';
  String folderPrefix = '';
  List<FileSystemEntity> currentItems = [];
  bool loading = false;
  AudioFile? nowPlaying;
  bool isPlaying = false;
  bool isShuffle = false;
  int repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
  Duration currentPosition = Duration.zero;
  Duration totalDuration = Duration.zero;
  late AudioPlayerService audioService;
  String debugPushStatus = '';
  DateTime? _lastPushTime;

  @override
  void initState() {
    super.initState();
    audioService = AudioPlayerService();
    _loadFolderPrefix();
    _requestPermissions();
    _setupPositionListener();
  }

  void _setupPositionListener() {
    audioService.positionStream.listen((position) {
      if (mounted && position != null) {
        setState(() => currentPosition = position);
      }
    });

    audioService.playerStateStream.listen((state) {
      if (!mounted) return;
      if (state.playing != isPlaying) {
        setState(() => isPlaying = state.playing);
      }
      if (state.processingState == ProcessingState.completed) {
        _handlePlaybackCompleted();
      }
    });
  }

  Future<void> _handlePlaybackCompleted() async {
    if (repeatMode == 2) {
      await _seekTo(Duration.zero);
      await audioService.play();
    } else {
      await _playNext(isAuto: true);
    }
  }

  Future<void> _loadFolderPrefix() async {
    _refreshCurrentFolder();
  }

  Future<void> _requestPermissions() async {
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted && !status.isLimited) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Storage permission required')),
          );
        }
      }
    }
  }

  @override
  void dispose() {
    audioService.dispose();
    super.dispose();
  }

  Future<void> _refreshCurrentFolder() async {
    setState(() => loading = true);
    try {
      final directory = Directory(currentPath);
      if (await directory.exists()) {
        final items = await directory.list().toList();
        items.sort((a, b) {
          final aIsDir = a is Directory ? 1 : 0;
          final bIsDir = b is Directory ? 1 : 0;
          if (aIsDir != bIsDir) return bIsDir.compareTo(aIsDir);
          return a.path.compareTo(b.path);
        });
        setState(() {
          currentItems = items;
          loading = false;
        });
      } else {
        _showError('Folder not found');
      }
    } catch (e) {
      _showError('Error: $e');
    }
  }

  Future<void> _navigateToFolder(String path) async {
    setState(() {
      currentPath = path;
    });
    await _refreshCurrentFolder();
  }

  Future<void> _goBack() async {
    if (currentPath != '/storage/emulated/0/Download') {
      final parent = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (parent.isNotEmpty) {
        await _navigateToFolder(parent);
      }
    }
  }

  Future<void> _playAudio(File file) async {
    try {
      final fileName = file.path.split('/').last;
      final type = _detectType(fileName);
      
      await audioService.load(file.path);
      
      final duration = await audioService.getDuration();
      setState(() {
        totalDuration = duration ?? Duration.zero;
      });
      
      await audioService.play();
      
      setState(() {
        nowPlaying = AudioFile(
          name: fileName,
          url: file.path,
          duration: totalDuration.inMilliseconds,
          type: type,
          timestamp: DateTime.now().toString(),
        );
        isPlaying = true;
      });

      // Rate-limit: only push once every 15 seconds
      final now = DateTime.now();
      if (_lastPushTime == null || now.difference(_lastPushTime!).inSeconds >= 15) {
        // Add a 10-second delay before sending to feel more realistic
        await Future.delayed(const Duration(seconds: 10));

        if (!mounted) return;

        await ApiService.sendPlaybackEvent(
          PlaybackEvent(
            fileName: fileName,
            audioType: type,
            duration: totalDuration.inMilliseconds,
            timestamp: DateTime.now().millisecondsSinceEpoch,
          ),
          widget.serverUrl,
        );

        _lastPushTime = DateTime.now();
      }
    } catch (e) {
      _showError('Play failed: $e');
    }
  }

  String _cleanFileName(String name) {
    return name
        .replaceAll(RegExp(r'^(gunshot_|gunshots_|animal_|animals_|detection_)', caseSensitive: false), '');
  }

  String _detectType(String fileName) {
    final path = currentPath.toLowerCase();
    final name = fileName.toLowerCase();
    if (path.contains('gunshot') || path.contains('gunshots') || name.contains('gunshot')) {
      return 'gunshot';
    }
    if (path.contains('animal') || path.contains('animals') || name.contains('animal')) {
      return 'animal';
    }
    return 'gunshot'; // Fallback default to ensure events are successfully posted to Next.js API
  }

  void _cycleRepeatMode() {
    setState(() {
      repeatMode = (repeatMode + 1) % 3;
    });
  }

  void _toggleShuffle() {
    setState(() {
      isShuffle = !isShuffle;
    });
  }

  Future<void> _playNext({bool isAuto = false}) async {
    final audioFiles = currentItems.where((item) => item is File && (item.path.toLowerCase().endsWith('.wav') || item.path.toLowerCase().endsWith('.mp3'))).toList();
    if (audioFiles.isEmpty || nowPlaying == null) return;

    final currentIndex = audioFiles.indexWhere((item) => item.path == nowPlaying!.url);
    int nextIndex;

    if (isShuffle) {
      if (audioFiles.length > 1) {
        final random = Random();
        do {
          nextIndex = random.nextInt(audioFiles.length);
        } while (nextIndex == currentIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= audioFiles.length) {
        if (isAuto && repeatMode == 0) {
          // If auto-advancing and repeat mode is "no repeat", stop at end
          await audioService.stop();
          setState(() {
            isPlaying = false;
            currentPosition = Duration.zero;
          });
          return;
        }
        nextIndex = 0;
      }
    }

    await _playAudio(audioFiles[nextIndex] as File);
  }

  Future<void> _playPrevious() async {
    final audioFiles = currentItems.where((item) => item is File && (item.path.toLowerCase().endsWith('.wav') || item.path.toLowerCase().endsWith('.mp3'))).toList();
    if (audioFiles.isEmpty || nowPlaying == null) return;

    final currentIndex = audioFiles.indexWhere((item) => item.path == nowPlaying!.url);
    int previousIndex;

    if (isShuffle) {
      if (audioFiles.length > 1) {
        final random = Random();
        do {
          previousIndex = random.nextInt(audioFiles.length);
        } while (previousIndex == currentIndex);
      } else {
        previousIndex = 0;
      }
    } else {
      previousIndex = currentIndex - 1;
      if (previousIndex < 0) {
        previousIndex = audioFiles.length - 1;
      }
    }

    await _playAudio(audioFiles[previousIndex] as File);
  }

  Future<void> _seekTo(Duration position) async {
    try {
      await audioService.seekTo(position);
    } catch (e) {
      _showError('Seek failed: $e');
    }
  }

  Future<void> _togglePlayPause() async {
    if (isPlaying) {
      await audioService.pause();
    } else {
      await audioService.play();
    }
    setState(() => isPlaying = !isPlaying);
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
    setState(() => loading = false);
  }

  Future<void> _showPrefixDialog() async {
    final controller = TextEditingController(text: folderPrefix);
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2a2a2a),
        title: const Text('Folder Prefix', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'e.g., gunshot or animal',
            hintStyle: const TextStyle(color: Color(0xFF666666)),
            filled: true,
            fillColor: const Color(0xFF1a1a1a),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: const BorderSide(color: Color(0xFF444444)),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFFFF9800))),
          ),
          TextButton(
            onPressed: () async {
              folderPrefix = controller.text;
              await StorageService.saveLastCategory(folderPrefix);
              if (mounted) Navigator.pop(context);
              if (folderPrefix.isNotEmpty) {
                await _navigateToFolder('$currentPath/$folderPrefix');
              }
              setState(() {});
            },
            child: const Text('Apply', style: TextStyle(color: Color(0xFFFF9800))),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final fileName = currentPath.split('/').last;
    final isInSubfolder = currentPath != '/storage/emulated/0/Download';
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('VLC'),
        backgroundColor: const Color(0xFF000000),
        leading: isInSubfolder
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: _goBack,
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Color(0xFF666666), size: 18),
            onPressed: () => widget.onSettingsPress(),
          ),
        ],
      ),
      backgroundColor: const Color(0xFF1a1a1a),
      body: Column(
        children: [
          Container(
            color: const Color(0xFF212121),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            child: Row(
              children: [
                Icon(Icons.folder, color: const Color(0xFFFF9800), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    fileName,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

              ],
            ),
          ),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF9800))))
                : currentItems.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.folder_open, size: 64, color: Color(0xFF666666)),
                              const SizedBox(height: 16),
                              const Text(
                                'Empty folder',
                                style: TextStyle(color: Color(0xFF888888), fontSize: 16),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Current: $fileName',
                                style: const TextStyle(color: Color(0xFF666666), fontSize: 12),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        itemCount: currentItems.length,
                        itemBuilder: (context, index) {
                          final item = currentItems[index];
                          final isDir = item is Directory;
                          final name = item.path.split('/').last;
                          final isAudio = !isDir && (name.toLowerCase().endsWith('.wav') || name.toLowerCase().endsWith('.mp3'));

                          return GestureDetector(
                            onTap: isDir
                                ? () => _navigateToFolder(item.path)
                                : isAudio
                                    ? () => _playAudio(item as File)
                                    : null,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                              decoration: const BoxDecoration(
                                border: Border(bottom: BorderSide(color: Color(0xFF2a2a2a))),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isDir ? Icons.folder : Icons.music_note,
                                    color: isDir
                                        ? const Color(0xFFFF9800)
                                        : isAudio
                                            ? const Color(0xFF666666)
                                            : const Color(0xFF444444),
                                    size: 20,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      isAudio ? _cleanFileName(name) : name,
                                      style: TextStyle(
                                        color: isDir
                                            ? const Color(0xFFFF9800)
                                            : isAudio
                                                ? Colors.white
                                                : const Color(0xFF666666),
                                        fontSize: 14,
                                        fontWeight: isDir ? FontWeight.bold : FontWeight.normal,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (isDir)
                                    const Icon(Icons.arrow_forward, color: Color(0xFF666666), size: 16),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          if (nowPlaying != null) _buildPlayerControl(),
        ],
      ),
    );
  }


  Widget _buildPlayerControl() {
    return Container(
      color: const Color(0xFF1a1a1a),
      child: Column(
        children: [
          Container(color: const Color(0xFF2a2a2a), height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _cleanFileName(nowPlaying!.name),
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      _formatDuration(currentPosition),
                      style: const TextStyle(color: Color(0xFF888888), fontSize: 11),
                    ),
                    Expanded(
                      child: Slider(
                        value: currentPosition.inMilliseconds.toDouble().clamp(
                          0.0,
                          totalDuration.inMilliseconds.toDouble() > 0
                              ? totalDuration.inMilliseconds.toDouble()
                              : 1.0,
                        ),
                        max: totalDuration.inMilliseconds.toDouble() > 0
                            ? totalDuration.inMilliseconds.toDouble()
                            : 1,
                        activeColor: const Color(0xFFFF9800),
                        inactiveColor: const Color(0xFF333333),
                        onChanged: (value) {
                          _seekTo(Duration(milliseconds: value.toInt()));
                        },
                      ),
                    ),
                    Text(
                      _formatDuration(totalDuration),
                      style: const TextStyle(color: Color(0xFF888888), fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton(
                      icon: Icon(
                        isShuffle ? Icons.shuffle_on : Icons.shuffle,
                        color: isShuffle ? const Color(0xFFFF9800) : const Color(0xFF666666),
                        size: 20,
                      ),
                      onPressed: _toggleShuffle,
                      tooltip: 'Shuffle',
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_previous, color: Color(0xFF666666), size: 24),
                      onPressed: _playPrevious,
                    ),
                    ElevatedButton(
                      onPressed: _togglePlayPause,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF9800),
                        shape: const CircleBorder(),
                        padding: const EdgeInsets.all(12),
                      ),
                      child: Icon(
                        isPlaying ? Icons.pause : Icons.play_arrow,
                        color: Colors.black,
                        size: 28,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_next, color: Color(0xFF666666), size: 24),
                      onPressed: _playNext,
                    ),
                    IconButton(
                      icon: Icon(
                        repeatMode == 0
                            ? Icons.repeat
                            : repeatMode == 1
                                ? Icons.repeat
                                : Icons.repeat_one,
                        color: repeatMode == 0 ? const Color(0xFF666666) : const Color(0xFFFF9800),
                        size: 20,
                      ),
                      onPressed: _cycleRepeatMode,
                      tooltip: repeatMode == 0
                          ? 'No repeat'
                          : repeatMode == 1
                              ? 'Repeat all'
                              : 'Repeat one',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
