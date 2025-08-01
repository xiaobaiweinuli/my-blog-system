CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    summary TEXT, 
    cover_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category TEXT NOT NULL,
    tags TEXT, 
    author_username TEXT NOT NULL,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);
INSERT INTO articles VALUES('021f485d-13d4-4cd0-bfcf-2a6197945b2a','娴嬭瘯','','杩欓噷鏄敱鑸归暱缁勫缓鐨勪竴涓叡璇嗐€佸叡寤恒€佸叡浜殑鍏泭绫荤煡璇嗗叡寤虹ぞ鍖猴紝鎷撳鎴愬憳鐨勭煡璇嗗拰浜鸿剦锛岃繘琛岃法鐣屼氦娴佷笌鍚堜綔锛岃涓€璺垚闀跨殑浣犺兘鎵惧埌鏇村蹇楀悓閬撳悎鐨勬湅鍙嬶紝涓€璧风粨浼村悓琛岋紝涓嶆儳鏈潵涔嬪彉灞€锛屼笉璐熸鐢熶箣鑺冲崕銆傜柅鎯呬箣涓嬶紝瓒婃潵瓒婂鐨勪汉鍙樻垚鑷敱鑱屼笟鑰咃紝涔熸剰璇嗗埌寰呭湪涓€瀹跺叕鍙告槸寰呬笉鍒伴€€浼戠殑锛岀ぞ鍖虹殑鎰忎箟涔嬩竴鏄粍寤轰竴涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴紝鎶卞洟鍙栨殩搴﹁繃瀵掑啲锛屼负缁堣韩瀛︿範鑰呰祴鑳芥湭鏉ワ紝浜掑府浜掑姪鐨勬皼鍥存槸绀惧尯鏈€寮曚互鑷豹鐨勬牳蹇冧环鍊艰銆傚€熺敤銆婂墠閫旀棤閲忋€嬪墽涓竴浣嶈€佽闀跨殑璇濓細涓€涓汉鎯宠淇濇寔鈥滈潚鏄モ€濆敮涓€鐨勬柟娉曞氨鏄粓韬涔犮€?,'涓€涓敱鑸归暱缁勫缓鐨勫叕鐩婄煡璇嗗叡寤虹ぞ鍖猴紝鏃ㄥ湪淇冭繘鎴愬憳闂寸殑璺ㄧ晫浜ゆ祦涓庡悎浣溿€傜ぞ鍖虹殑鎰忎箟涔嬩竴鏄负鑷敱鑱屼笟鑰呭拰缁堣韩瀛︿範鑰呮彁渚涗竴涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴€傜ぞ鍖虹殑鏍稿績浠峰€艰鏄簰甯簰鍔╋紝鏃ㄥ湪涓烘垚鍛樿祴鑳芥湭鏉ャ€傝繖涓ぞ鍖洪紦鍔辩粓韬涔狅紝浠ヤ繚鎸佲€滈潚鏄モ€濆拰鍚戝墠鍙戝睍銆?,NULL,'','draft','uncategorized','[]','admin',NULL,'2025-07-14T19:05:54.439Z','2025-07-14T19:05:54.439Z',0,0);
INSERT INTO articles VALUES('a515f309-d9d6-4097-87cf-664b4d54f94d','娴嬭瘯2','2','杩欓噷鏄敱鑸归暱缁勫缓鐨勪竴涓叡璇嗐€佸叡寤恒€佸叡浜殑鍏泭绫荤煡璇嗗叡寤虹ぞ鍖猴紝鎷撳鎴愬憳鐨勭煡璇嗗拰浜鸿剦锛岃繘琛岃法鐣屼氦娴佷笌鍚堜綔锛岃涓€璺垚闀跨殑浣犺兘鎵惧埌鏇村蹇楀悓閬撳悎鐨勬湅鍙嬶紝涓€璧风粨浼村悓琛岋紝涓嶆儳鏈潵涔嬪彉灞€锛屼笉璐熸鐢熶箣鑺冲崕銆傜柅鎯呬箣涓嬶紝瓒婃潵瓒婂鐨勪汉鍙樻垚鑷敱鑱屼笟鑰咃紝涔熸剰璇嗗埌寰呭湪涓€瀹跺叕鍙告槸寰呬笉鍒伴€€浼戠殑锛岀ぞ鍖虹殑鎰忎箟涔嬩竴鏄粍寤轰竴涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴紝鎶卞洟鍙栨殩搴﹁繃瀵掑啲锛屼负缁堣韩瀛︿範鑰呰祴鑳芥湭鏉ワ紝浜掑府浜掑姪鐨勬皼鍥存槸绀惧尯鏈€寮曚互鑷豹鐨勬牳蹇冧环鍊艰銆傚€熺敤銆婂墠閫旀棤閲忋€嬪墽涓竴浣嶈€佽闀跨殑璇濓細涓€涓汉鎯宠淇濇寔鈥滈潚鏄モ€濆敮涓€鐨勬柟娉曞氨鏄粓韬涔犮€?,'杩欐槸涓€鍊嬬敱鑸归暱缁勫缓鐨勫叡璀樸€佸叡寤恒€佸叡浜殑鍏泭椤炵煡璇嗗叡寤虹ぞ鍖恒€傝绀惧尯鏃ㄥ湪涓烘垚鍛樻彁渚涗竴涓煡璇嗗拰浜鸿剦鐨勬嫇瀹藉钩鍙帮紝淇冭繘璺ㄧ晫浜ゆ祦涓庡悎浣滐紝甯姪鎴愰暱涓殑涓綋鎵惧埌蹇楀悓閬撳悎鐨勬湅鍙嬨€傜ぞ鍖轰笉浠呮彁渚涗簡涓€涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴紝涔熻祴鑳界粓韬涔犺€咃紝涓轰粬浠彁渚涗簰甯簰鍔╃殑姘涘洿銆傜ぞ鍖虹殑鏍稿績浠峰€艰鏄€氳繃缁堣韩瀛︿範淇濇寔鈥滈潚鏄モ€濓紝璁╂瘡涓汉閮借兘',NULL,'','draft','uncategorized','[]','admin',NULL,'2025-07-14T19:09:41.836Z','2025-07-14T19:09:41.838Z',0,0);
INSERT INTO articles VALUES('43347323-2432-4c37-b978-47bcf07dbebf','娴嬭瘯2','ceshi','杩欓噷鏄敱鑸归暱缁勫缓鐨勪竴涓叡璇嗐€佸叡寤恒€佸叡浜殑鍏泭绫荤煡璇嗗叡寤虹ぞ鍖猴紝鎷撳鎴愬憳鐨勭煡璇嗗拰浜鸿剦锛岃繘琛岃法鐣屼氦娴佷笌鍚堜綔锛岃涓€璺垚闀跨殑浣犺兘鎵惧埌鏇村蹇楀悓閬撳悎鐨勬湅鍙嬶紝涓€璧风粨浼村悓琛岋紝涓嶆儳鏈潵涔嬪彉灞€锛屼笉璐熸鐢熶箣鑺冲崕銆傜柅鎯呬箣涓嬶紝瓒婃潵瓒婂鐨勪汉鍙樻垚鑷敱鑱屼笟鑰咃紝涔熸剰璇嗗埌寰呭湪涓€瀹跺叕鍙告槸寰呬笉鍒伴€€浼戠殑锛岀ぞ鍖虹殑鎰忎箟涔嬩竴鏄粍寤轰竴涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴紝鎶卞洟鍙栨殩搴﹁繃瀵掑啲锛屼负缁堣韩瀛︿範鑰呰祴鑳芥湭鏉ワ紝浜掑府浜掑姪鐨勬皼鍥存槸绀惧尯鏈€寮曚互鑷豹鐨勬牳蹇冧环鍊艰銆傚€熺敤銆婂墠閫旀棤閲忋€嬪墽涓竴浣嶈€佽闀跨殑璇濓細涓€涓汉鎯宠淇濇寔鈥滈潚鏄モ€濆敮涓€鐨勬柟娉曞氨鏄粓韬涔犮€?,'',NULL,'','draft','uncategorized','[]','admin',NULL,'2025-07-14T19:12:25.058Z','2025-07-14T19:12:25.060Z',0,0);
INSERT INTO articles VALUES('718e6423-dbf4-4af2-b935-70cdbe1cb8e2','鍏紑','gongkai','杩欓噷鏄敱鑸归暱缁勫缓鐨勪竴涓叡璇嗐€佸叡寤恒€佸叡浜殑鍏泭绫荤煡璇嗗叡寤虹ぞ鍖猴紝鎷撳鎴愬憳鐨勭煡璇嗗拰浜鸿剦锛岃繘琛岃法鐣屼氦娴佷笌鍚堜綔锛岃涓€璺垚闀跨殑浣犺兘鎵惧埌鏇村蹇楀悓閬撳悎鐨勬湅鍙嬶紝涓€璧风粨浼村悓琛岋紝涓嶆儳鏈潵涔嬪彉灞€锛屼笉璐熸鐢熶箣鑺冲崕銆傜柅鎯呬箣涓嬶紝瓒婃潵瓒婂鐨勪汉鍙樻垚鑷敱鑱屼笟鑰咃紝涔熸剰璇嗗埌寰呭湪涓€瀹跺叕鍙告槸寰呬笉鍒伴€€浼戠殑锛岀ぞ鍖虹殑鎰忎箟涔嬩竴鏄粍寤轰竴涓嚜瀛︽皼鍥存祿鍘氱殑澶у搴紝鎶卞洟鍙栨殩搴﹁繃瀵掑啲锛屼负缁堣韩瀛︿範鑰呰祴鑳芥湭鏉ワ紝浜掑府浜掑姪鐨勬皼鍥存槸绀惧尯鏈€寮曚互鑷豹鐨勬牳蹇冧环鍊艰銆傚€熺敤銆婂墠閫旀棤閲忋€嬪墽涓竴浣嶈€佽闀跨殑璇濓細涓€涓汉鎯宠淇濇寔鈥滈潚鏄モ€濆敮涓€鐨勬柟娉曞氨鏄粓韬涔犮€?,'',NULL,'','published','uncategorized','[]','admin','2025-07-14T19:34:13.565Z','2025-07-14T19:34:13.567Z','2025-07-15 08:33:06',1,0);
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    r2_key TEXT NOT NULL, 
    uploaded_by_username TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    folder TEXT DEFAULT '/', 
    metadata TEXT 
);
CREATE TABLE friend_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    category TEXT DEFAULT 'friend',
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    order_index INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    created_by TEXT,
    approved_by TEXT
);
INSERT INTO friend_links VALUES('link_vercel','Vercel','https://vercel.com','鐜颁唬鍖栭儴缃插钩鍙帮紤',NULL,'tech','pending',2,1,NULL,'2025-07-14 19:04:18','2025-07-15 18:39:43',NULL,NULL,NULL);
INSERT INTO friend_links VALUES('link_tailwind','Tailwind CSS','https://tailwindcss.com','瀹炵敤浼樺厛鐨?CSS 妗嗘灦',NULL,'tech','pending',3,0,NULL,'2025-07-14 19:04:18','2025-07-15 18:39:43',NULL,NULL,NULL);
INSERT INTO friend_links VALUES('link_cloudflare','Cloudflare','https://cloudflare.com','鍏ㄧ悆 CDN 鍜屽畨鍏ㄦ湇鍔?,NULL,'tech','approved',4,0,NULL,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL,NULL,NULL);
INSERT INTO friend_links VALUES('4096eec7-8eb8-421c-a7eb-50863ce1c0e0','鏄熼湝绗旇','https://github.com/xiaobaiweinuli','锛э綁锝旓綀锝曪絺鍦板潃','https://avatars.githubusercontent.com/u/94781176?s=400&u=57d10a26d32ef907e3e468162f1d6ff099fd0177&v=4','鎶€鏈?,'approved',0,0,NULL,'2025-07-15T16:56:33.500Z','2025-07-15T16:56:33.500Z','2025-07-15T16:56:33.500Z','admin','admin');
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address TEXT
);
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);
INSERT INTO categories VALUES('cat_tech','鎶€鏈?,'tech','鎶€鏈浉鍏虫枃绔?,'#3b82f6',1,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO categories VALUES('cat_life','鐢熸椿','life','鐢熸椿鎰熸偀鍜屽垎浜?,'#10b981',2,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO categories VALUES('cat_uncategorized','鏈垎绫?','uncategorized','鏈垎绫绘枃绔?,'#6b7280',999,'2025-07-14 19:04:18','2025-07-15T12:34:42.301Z',NULL);
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10b981',
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);
INSERT INTO tags VALUES('tag_react','React','react','React 鐩稿叧鍐呭','#61dafb',1,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO tags VALUES('tag_typescript','TypeScript','typescript','TypeScript 鐩稿叧鍐呭','#3178c6',2,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO tags VALUES('tag_nextjs','Next.js','nextjs','Next.js 鐩稿叧鍐呭','#000000',3,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO tags VALUES('tag_javascript','JavaScript','javascript','JavaScript 鐩稿叧鍐呭','#f7df1e',4,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
INSERT INTO tags VALUES('tag_css','CSS','css','CSS 鐩稿叧鍐呭','#1572b6',5,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL);
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    meta_title TEXT,
    meta_description TEXT,
    status TEXT CHECK (status IN ('draft', 'published', 'private')) DEFAULT 'draft',
    template TEXT DEFAULT 'default',
    order_index INTEGER DEFAULT 0,
    is_in_menu BOOLEAN DEFAULT false,
    menu_title TEXT,
    parent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    created_by TEXT,
    FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL
);
INSERT INTO pages VALUES('page_about','鍏充簬鎴戜滑','about','# 鍏充簬鎴戜滑\n\n杩欓噷鏄叧浜庨〉闈㈢殑鍐呭...','浜嗚В鏇村鍏充簬鎴戜滑鐨勪俊鎭?,NULL,NULL,'published','default',1,1,'鍏充簬',NULL,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL,NULL);
INSERT INTO pages VALUES('page_contact','鑱旂郴鎴戜滑','contact','# 鑱旂郴鎴戜滑\n\n濡傛湁浠讳綍闂锛岃闅忔椂鑱旂郴鎴戜滑...','鑱旂郴鏂瑰紡鍜屽弽棣堟笭閬?,NULL,NULL,'published','default',2,1,'鑱旂郴',NULL,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL,NULL);
INSERT INTO pages VALUES('page_privacy','闅愮鏀跨瓥','privacy','# 闅愮鏀跨瓥\n\n鎴戜滑閲嶈鎮ㄧ殑闅愮...','浜嗚В鎴戜滑濡備綍淇濇姢鎮ㄧ殑闅愮',NULL,NULL,'published','default',3,0,NULL,NULL,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL,NULL);
INSERT INTO pages VALUES('page_terms','鏈嶅姟鏉℃','terms','# 鏈嶅姟鏉℃\n\n浣跨敤鏈綉绔欏嵆琛ㄧず鎮ㄥ悓鎰忎互涓嬫潯娆?..','缃戠珯浣跨敤鏉℃鍜屾潯浠?,NULL,NULL,'published','default',4,0,NULL,NULL,'2025-07-14 19:04:18','2025-07-14 19:04:18',NULL,NULL);
CREATE TABLE article_views (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    visitor_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    city TEXT,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
CREATE TABLE site_analytics (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, 
    page_path TEXT NOT NULL,
    page_title TEXT,
    visitor_count INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate REAL DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, page_path)
);
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);
INSERT INTO settings VALUES('site_name','Modern Blog','缃戠珯鍚嶇О','2025-07-14 19:04:18',NULL);
INSERT INTO settings VALUES('site_description','鐜颁唬鍖栫殑鎶€鏈崥瀹㈠钩鍙?,'缃戠珯鎻忚堪','2025-07-14 19:04:18',NULL);
INSERT INTO settings VALUES('max_file_size','10485760','鏈€澶ф枃浠朵笂浼犲ぇ灏?(10MB)','2025-07-14 19:04:18',NULL);
INSERT INTO settings VALUES('allowed_file_types','["image/jpeg","image/png","image/gif","image/webp","application/pdf","text/plain"]','鍏佽鐨勬枃浠剁被鍨?,'2025-07-14 19:04:18',NULL);
INSERT INTO settings VALUES('admin_emails','[]','绠＄悊鍛橀偖绠卞垪琛?(JSON 鏁扮粍)','2025-07-14 19:04:18',NULL);
INSERT INTO settings VALUES('last_restore_time','2025-07-15T13:05:36.027Z',NULL,'2025-07-15 13:05:36',NULL);
INSERT INTO settings VALUES('last_restore_backup_id','backup_1752583109783',NULL,'2025-07-15 13:05:36',NULL);
INSERT INTO settings VALUES('last_backup_time','2025-07-15T15:53:33.739Z',NULL,'2025-07-15 15:53:33',NULL);
INSERT INTO settings VALUES('last_backup_id','backup_1752594813739',NULL,'2025-07-15 15:53:33',NULL);
CREATE TABLE _cf_METADATA (
        key INTEGER PRIMARY KEY,
        value BLOB
      );
INSERT INTO _cf_METADATA VALUES(2,555);
CREATE TRIGGER update_articles_updated_at 
    AFTER UPDATE ON articles
    BEGIN
        UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
CREATE TRIGGER update_friend_links_updated_at 
    AFTER UPDATE ON friend_links
    BEGIN
        UPDATE friend_links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_author_id ON articles(author_username);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published_at ON articles(published_at);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by_username);
CREATE INDEX idx_files_type ON files(type);
CREATE INDEX idx_files_folder ON files(folder);
CREATE INDEX idx_friend_links_status ON friend_links(status);
CREATE INDEX idx_friend_links_category ON friend_links(category);
CREATE INDEX idx_friend_links_order ON friend_links(order_index);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories(order_index);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_order ON tags(order_index);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_order ON pages(order_index);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_article_views_article_id ON article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON article_views(viewed_at);
CREATE INDEX idx_article_views_visitor_id ON article_views(visitor_id);
CREATE INDEX idx_site_analytics_date ON site_analytics(date);
CREATE INDEX idx_site_analytics_page_path ON site_analytics(page_path);
CREATE INDEX idx_site_analytics_date_path ON site_analytics(date, page_path);
COMMIT;
