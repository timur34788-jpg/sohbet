/* Nature.co globals.js - ILK script olarak yukle */
(function(){
var g={'_isMuted':false,'_deskRoom':null,'TV_CHANNELS':[],'_reminderTimers':[],'_gifApiReady':false,'STATUS_PRESETS':[],'SLASH_CMDS':[],'GAME_CATALOG':[],'GAME_CATEGORIES':[],'GREETING_MSGS':[],'IDLE_MSGS':[],'TURK_QUOTES':[],'AMBIANCE_TRACKS':[],'NOTIF_TONES':[],'RING_TONES':[],'QUICK_REACTS':[],'ICONS':{},'SVG_ICONS':{},'SHORTCODES':{},'EMOJIS':{},'EMOJI_ICONS':{},'CAT_LABELS':{},'SPEECH':{},'STUN_SERVERS':{},'UI_STYLES':[],'_db':null,'_auth':null,'_cu':null,'_uid':null,'_isAdmin':false,'_online':{},'_unread':{},'_lastMsg':{},'_reads':{},'_rooms':{},'_users':{},'_friendReqs':{},'_sentReqs':{},'_friends':{},'_notifs':[],'_cRoom':null,'_stopMsg':null,'_stopOnl':null,'_hbTimer':null,'_currentMsgBox':'chatMsgs','_origDeskAdminTab':null,'_natureBotInstance':null};
Object.keys(g).forEach(function(k){if(typeof window[k]==='undefined')window[k]=g[k];});
if(typeof window.IS_DESKTOP!=='function')window.IS_DESKTOP=function(){return window.innerWidth>=1024;};
if(typeof window.IS_MOBILE!=='function')window.IS_MOBILE=function(){return window.innerWidth<768;};
})();
