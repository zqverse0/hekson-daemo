// 交互原语的统一外壳：负责跳过、自动完成和清理，原语本身只写交互逻辑。
//
//   primitive(cut, prompt, api => {
//     api.on(target, type, fn)       注册监听（结束时自动移除）
//     api.every(fn, ms) / api.after(fn, ms)   定时器（结束时自动清除）
//     api.stopOnEnd(stop)            结束时调用（如 loop() 返回的 stop）
//     api.finish(value)              正常完成
//     return complete;               "立即完成自己"的函数：跳过、无操作自动推进都走它
//   })
//
// 只响应主触点请用 core/input.js 的 primary() 包一层。
export function primitive(cut, promptText, setup) {
  return new Promise(res => {
    const st = cut.state;
    const cleanups = [];
    let done = false, complete = null;
    const api = {
      on(target, type, fn, opt) { target.addEventListener(type, fn, opt); cleanups.push(() => target.removeEventListener(type, fn, opt)); },
      every(fn, ms) { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; },
      after(fn, ms) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
      stopOnEnd(stop) { cleanups.push(stop); },
      get done() { return done; },
      finish(value) {
        if (done) return;
        done = true;
        if (st.cancel === complete) st.cancel = null;
        cleanups.forEach(f => f());
        cut.prompt(null);
        res(value);
      },
    };
    cut.hush();                     // 交互时不留上一句对白
    cut.prompt(promptText);
    complete = setup(api) || (() => api.finish());
    if (done) return;               // setup 内已同步完成
    st.cancel = complete;
    if (st.skip) complete();
  });
}
