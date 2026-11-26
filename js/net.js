/* Live connection between the host screen and phones.
   Primary: PeerJS (WebRTC data channels, free public broker, no account or key).
   Always on as well: BroadcastChannel, so host + player tabs in the same browser
   work offline (used for rehearsal and testing: add ?local to play.html). */

const NET_PREFIX = 'romania-unlocked-v1-';

function makeRoomCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

class HostNet {
  constructor(room, { onMessage, onStatus, onLeave }) {
    this.room = room;
    this.onMessage = onMessage;
    this.onStatus = onStatus || (() => {});
    this.onLeave = onLeave || (() => {});
    this.conns = new Map(); // tid -> PeerJS DataConnection
    this.status = 'starting';
    this.tries = 0;
  }
  start() {
    try {
      this.bc = new BroadcastChannel(NET_PREFIX + this.room);
      this.bc.onmessage = (e) => {
        const m = e.data;
        if (!m || m.to !== 'host' || !m.from) return;
        this.onMessage('bc:' + m.from, m.msg);
      };
    } catch (e) { this.bc = null; }
    if (window.Peer) this._peer(); else this._set('local');
  }
  _set(s) { this.status = s; this.onStatus(s); }
  _peer() {
    this._set('connecting');
    let peer;
    try { peer = new Peer(NET_PREFIX + this.room.toLowerCase(), { debug: 0 }); }
    catch (e) { this._set('offline'); return; }
    this.peer = peer;
    peer.on('open', () => { this.tries = 0; this._set('online'); });
    peer.on('connection', (conn) => {
      const tid = 'p:' + conn.peer + ':' + (conn.connectionId || '');
      conn.on('open', () => { this.conns.set(tid, conn); });
      conn.on('data', (msg) => this.onMessage(tid, msg));
      const drop = () => { this.conns.delete(tid); this.onLeave(tid); };
      conn.on('close', drop);
      conn.on('error', drop);
    });
    peer.on('disconnected', () => {
      this._set('reconnecting');
      setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500);
    });
    peer.on('error', (err) => {
      const t = err && err.type;
      if (t === 'unavailable-id') {
        // The room id is still held from before a refresh: retry until released.
        this._set('claiming');
        try { peer.destroy(); } catch (e) {}
        if (++this.tries < 20) setTimeout(() => this._peer(), 3000);
        else this._set('offline');
      } else if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed' || t === 'browser-incompatible') {
        this._set('offline');
        try { peer.destroy(); } catch (e) {}
        setTimeout(() => this._peer(), 6000);
      }
    });
  }
  send(tid, msg) {
    if (tid.startsWith('bc:')) { if (this.bc) this.bc.postMessage({ to: tid.slice(3), msg }); return; }
    const c = this.conns.get(tid);
    if (c && c.open) { try { c.send(msg); } catch (e) {} }
  }
  broadcast(msg) {
    if (this.bc) this.bc.postMessage({ to: '*', msg });
    for (const c of this.conns.values()) if (c.open) { try { c.send(msg); } catch (e) {} }
  }
  destroy() {
    try { this.peer && this.peer.destroy(); } catch (e) {}
    try { this.bc && this.bc.close(); } catch (e) {}
  }
}

class PlayerNet {
  constructor(room, { onMessage, onStatus, local }) {
    this.room = room;
    this.onMessage = onMessage;
    this.onStatus = onStatus || (() => {});
    this.local = !!local || !window.Peer;
    this.cid = Math.random().toString(36).slice(2, 10);
    this.queue = [];
  }
  start() {
    if (this.local) {
      this.bc = new BroadcastChannel(NET_PREFIX + this.room);
      this.bc.onmessage = (e) => {
        const m = e.data;
        if (!m || (m.to !== '*' && m.to !== this.cid)) return;
        if (m.msg) this.onMessage(m.msg);
      };
      this.onStatus('online');
      this._flush();
      return;
    }
    this._peer();
  }
  _peer() {
    this.onStatus('connecting');
    try { this.peer = new Peer({ debug: 0 }); } catch (e) { this.onStatus('offline'); return; }
    this.peer.on('open', () => this._connect());
    this.peer.on('error', (err) => {
      const t = err && err.type;
      if (t === 'peer-unavailable') { this.onStatus('nohost'); setTimeout(() => this._connect(), 3000); }
      else if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') {
        this.onStatus('offline');
        try { this.peer.destroy(); } catch (e) {}
        setTimeout(() => this._peer(), 4000);
      }
    });
    this.peer.on('disconnected', () => { setTimeout(() => { try { this.peer.reconnect(); } catch (e) {} }, 1500); });
  }
  _connect() {
    if (!this.peer || this.peer.destroyed) return;
    if (this.conn && this.conn.open) return;
    const conn = this.peer.connect(NET_PREFIX + this.room.toLowerCase(), { reliable: true });
    this.conn = conn;
    conn.on('open', () => { this.onStatus('online'); this._flush(); });
    conn.on('data', (msg) => this.onMessage(msg));
    conn.on('close', () => { this.onStatus('reconnecting'); setTimeout(() => this._connect(), 2000); });
    conn.on('error', () => {});
  }
  _flush() { const q = this.queue; this.queue = []; q.forEach((m) => this.send(m)); }
  send(msg) {
    if (this.local) {
      if (!this.bc) { this.queue.push(msg); return; }
      this.bc.postMessage({ to: 'host', from: this.cid, msg });
      return;
    }
    if (this.conn && this.conn.open) { try { this.conn.send(msg); } catch (e) {} }
    else if (msg.t !== 'ping') this.queue.push(msg);
  }
}
