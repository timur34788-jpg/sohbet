/* Nature.co — globals.js */
/* Bu dosya tüm paylaşılan global değişkenleri güvenli şekilde tanımlar */
/* index.html'de İLK script olarak yüklenmeli */

(function() {
  var guards = {
    '_isMuted': false,
    '_deskRoom': null,
    'TV_CHANNELS': null,
    '_reminderTimers': [],
    '_origDeskAdminTab': null,
    '_natureBotInstance': null,
    'clearUnreadBadge': null,
    'markRoomRead': null,
    'NatureBotPet': null
  };

  Object.keys(guards).forEach(function(key) {
    if (typeof window[key] === 'undefined') {
      window[key] = guards[key];
    }
  });
})();
