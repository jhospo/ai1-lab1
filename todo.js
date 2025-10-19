(() => {
    class TodoApp {
        constructor() {
            this.$search = document.getElementById('todo-search');
            this.$list   = document.getElementById('todo-list');
            this.$text   = document.getElementById('todo-text');
            this.$date   = document.getElementById('todo-date');
            this.$save   = document.getElementById('todo-save');

            this.storageKey = 'lab_b_tasks';
            this.tasks = this.load();
            this.term = '';
            this.currentEdit = null;

            this.$save.addEventListener('click', () => this.add());
            this.$search.addEventListener('input', () => { this.term = this.$search.value.trim(); this.draw(); });
            document.addEventListener('mousedown', e => this.outsideEdit(e));

            this.draw();
        }

        load() {
            try { const r = localStorage.getItem(this.storageKey); return r ? JSON.parse(r) : []; }
            catch { return []; }
        }
        save() { localStorage.setItem(this.storageKey, JSON.stringify(this.tasks)); }

        uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
        isFuture(d){ if(!d) return true; const t=new Date(); t.setHours(0,0,0,0); return new Date(d+'T00:00:00')>t; }
        valid(t){ const s=t.trim(); return s.length>=3 && s.length<=255; }
        esc(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
        hl(t,term){
            if(!term||term.length<2) return this.esc(t);
            const re=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
            return this.esc(t).replace(re, m => `<mark>${m}</mark>`);
        }
        get filtered(){
            const q=this.term.toLowerCase();
            if(q.length<2) return this.tasks;
            return this.tasks.filter(t=>t.text.toLowerCase().includes(q));
        }

        add() {
            const text=this.$text.value.trim(), date=this.$date.value.trim();
            if(!this.valid(text)){ alert('Tekst 3–255 znaków.'); return; }
            if(!this.isFuture(date)){ alert('Data pusta lub przyszła.'); return; }
            this.tasks.push({ id:this.uid(), text, due:date||null });
            this.$text.value=''; this.$date.value='';
            this.save(); this.draw();
        }

        del(id){ this.tasks=this.tasks.filter(t=>t.id!==id); this.save(); this.draw(); }

        startEdit(task, li) {
            if(this.currentEdit && this.currentEdit.id!==task.id) this.commitEdit();
            if(this.currentEdit) return;

            const wrap = li.querySelector('.todo-main');
            const ti = document.createElement('input'); ti.type='text'; ti.value=task.text;
            const di = document.createElement('input'); di.type='date'; di.value=task.due||'';
            const btn = document.createElement('button'); btn.textContent='Zapisz';

            const saveEdit = () => this.commitEdit();
            btn.addEventListener('click', saveEdit);
            ti.addEventListener('keydown', e => { if(e.key==='Enter') saveEdit(); });
            di.addEventListener('keydown', e => { if(e.key==='Enter') saveEdit(); });

            wrap.innerHTML=''; wrap.append(ti, di, btn);
            this.currentEdit = { id: task.id, ti, di, el: wrap };
            setTimeout(() => ti.focus(), 0);
        }

        commitEdit(){
            if(!this.currentEdit) return;
            const { id, ti, di } = this.currentEdit;
            const t = ti.value.trim(), d = di.value.trim();
            if(!this.valid(t)){ alert('Tekst 3–255 znaków.'); return; }
            if(!this.isFuture(d)){ alert('Data pusta lub przyszła.'); return; }
            const i = this.tasks.findIndex(x=>x.id===id);
            if(i>-1){ this.tasks[i].text=t; this.tasks[i].due=d||null; this.save(); }
            this.currentEdit = null; this.draw();
        }

        outsideEdit(e){
            if(!this.currentEdit) return;
            if(this.currentEdit.el && this.currentEdit.el.contains(e.target)) return;
            const btn = e.target.closest('button');
            if(btn && btn.textContent === 'Zapisz') return;
            this.commitEdit();
        }

        draw(){
            this.$list.innerHTML='';
            const arr=this.filtered;
            if(!arr.length){
                const li=document.createElement('li');
                li.textContent=this.term ? 'Brak wyników.' : 'Brak zadań.';
                this.$list.append(li);
                return;
            }
            for(const t of arr){
                const li=document.createElement('li'); li.className='todo-item';
                const main=document.createElement('div'); main.className='todo-main';

                const chk=document.createElement('input'); chk.type='checkbox';
                const txt=document.createElement('span'); txt.className='todo-text'; txt.innerHTML=this.hl(t.text,this.term);
                const dat=document.createElement('span'); dat.className='todo-date'; if(t.due) dat.textContent=t.due;

                main.append(chk, txt, dat);

                main.addEventListener('click', ev => {
                    if(ev.target.tagName === 'BUTTON') return;
                    if(this.currentEdit && this.currentEdit.id === t.id) return;
                    this.startEdit(t, li);
                });

                const del=document.createElement('button');
                del.textContent='USUN';
                del.addEventListener('click', e => { e.stopPropagation(); this.del(t.id); });

                li.append(main, del);
                this.$list.append(li);
            }
        }
    }
    document.readyState==='loading'
        ? document.addEventListener('DOMContentLoaded', () => new TodoApp())
        : new TodoApp();
})();
