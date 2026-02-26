# Calling Audio Mute Feature

## Overview
Added a mute toggle button for customer calling audio notifications in the TV Real Entertainment page.

## Feature Details

### Location
The mute button is located in the queue sidebar header, next to "ALL STORES QUEUE" title.

### Visual Design
- **Position**: Top-right of the queue sidebar (30% width left panel)
- **Icon**: 
  - 🔊 VolumeUp icon when audio is ON (blue)
  - 🔇 VolumeOff icon when audio is MUTED (red)
- **Colors**:
  - Audio ON: Blue (#00d2ff) with light blue background
  - Audio MUTED: Red (#ff3f34) with light red background
- **Tooltip**: Shows current state on hover

### Functionality

#### When Audio is ON (Default)
- Button shows VolumeUp icon in blue
- Customer calling audio plays every 10 seconds for "READY FOR PICKUP" status
- Amharic number audio plays for ticket numbers

#### When Audio is MUTED
- Button shows VolumeOff icon in red
- All customer calling audio is silenced
- No audio plays even when customers are in "READY FOR PICKUP" status
- Visual notifications still work (flashing, colors, etc.)

### User Interaction
1. Click the button to toggle mute state
2. State persists during the session
3. Visual feedback shows current state immediately

### Technical Implementation

#### State Management
```javascript
const [callingAudioMuted, setCallingAudioMuted] = useState(false);
```

#### Audio Control
The `playNumber` function checks the mute state before playing audio:
```javascript
if (callingAudioMuted) {
  return Promise.resolve(); // Skip audio playback
}
```

#### UI Component
```jsx
<IconButton
  onClick={() => setCallingAudioMuted(!callingAudioMuted)}
  sx={{
    bgcolor: callingAudioMuted ? 'rgba(255, 63, 52, 0.2)' : 'rgba(0, 210, 255, 0.2)',
    color: callingAudioMuted ? '#ff3f34' : '#00d2ff',
    border: `2px solid ${callingAudioMuted ? '#ff3f34' : '#00d2ff'}`,
  }}
  title={callingAudioMuted ? 'Calling Audio Muted' : 'Calling Audio On'}
>
  {callingAudioMuted ? <VolumeOff /> : <VolumeUp />}
</IconButton>
```

## YouTube Audio

### Why No YouTube Mute Button?
- YouTube player has its own built-in volume controls
- YouTube starts muted by default (mute: 1 in playerVars)
- Users can unmute directly from YouTube player controls
- No need for duplicate mute control

### YouTube Default State
- Starts muted automatically
- User can click YouTube's volume icon to unmute
- Volume control is part of YouTube's native interface

## Use Cases

### Scenario 1: Quiet Environment
- User wants to see queue but not hear audio
- Click mute button → Audio stops
- Visual notifications continue working

### Scenario 2: Testing/Demo
- User wants to test without disturbing others
- Mute calling audio
- YouTube can be unmuted separately if needed

### Scenario 3: Night Shift
- Reduce noise during quiet hours
- Mute calling audio
- Staff can still see visual alerts

## Files Modified

### clients/src/components/Customer-Service/TvRealEntertainment.js
- Added `callingAudioMuted` state
- Added mute toggle button in queue sidebar header
- Updated `playNumber` function to check mute state
- Added visual feedback for mute state

### clients/src/components/Customer-Service/YouTubePlayerIsolated.js
- No changes needed (uses default YouTube controls)
- Kept mute: 1 in playerVars (default muted)

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Queue Sidebar (30%)          │  TV Display (70%)           │
│                                │                             │
│  ALL STORES QUEUE    [🔊]     │                             │
│  ⏰ 10:30:45 AM               │                             │
│  ─────────────────────────    │                             │
│                                │                             │
│  📊 Stats                      │    YouTube Player           │
│  • 5 Total                     │    (with own controls)      │
│  • 2 Ready                     │                             │
│                                │                             │
│  🔔 READY NOW                  │                             │
│  [Customer cards...]           │                             │
│                                │                             │
│  WAITING                       │                             │
│  [Customer cards...]           │                             │
│                                │                             │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

✅ Quick audio control without leaving the page
✅ Visual feedback shows current state clearly
✅ No interference with YouTube controls
✅ Maintains all visual notifications
✅ Simple one-click toggle
✅ Intuitive icon-based interface
✅ Color-coded for easy recognition

## Testing

### Test 1: Mute Toggle
1. Open TV Real Entertainment page
2. Wait for customers in "READY FOR PICKUP" status
3. Verify audio plays every 10 seconds
4. Click mute button (should turn red)
5. Verify audio stops
6. Click again (should turn blue)
7. Verify audio resumes

### Test 2: Visual Notifications
1. Mute the calling audio
2. Verify customer cards still flash/animate
3. Verify status colors still update
4. Verify queue still scrolls

### Test 3: YouTube Independence
1. Mute calling audio
2. Play YouTube video
3. Unmute YouTube using its controls
4. Verify YouTube audio works
5. Verify calling audio still muted

## Future Enhancements (Optional)

- Save mute preference to database (persist across sessions)
- Add keyboard shortcut (e.g., 'M' key to toggle)
- Add volume slider for calling audio (not just on/off)
- Add different audio profiles (quiet, normal, loud)
