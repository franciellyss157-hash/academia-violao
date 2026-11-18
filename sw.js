const V='av-v2',F=['./','index.html','css/style.css','css/lessons.css','css/certificate.css','js/storage.js','js/courses.js','js/lessons.js','js/progress.js','js/quizzes.js','js/exercises.js','js/practice.js','js/certificate.js','js/app.js','manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
