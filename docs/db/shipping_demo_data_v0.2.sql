-- ============================================================
-- Shipping Service Demo Data
-- Version: 0.2.0
-- Date: 2026-02-16
-- Description: shippings + 認証・認可デモデータ (ADR-008 Phase 1)
-- Prerequisite: shipping_db_v0.2.sql を先に実行すること
-- ============================================================

USE shipping;

-- ============================================================
-- 1. 認証・認可マスタデータ
-- ============================================================

-- ----- Roles -----
DELETE FROM role_permissions;
DELETE FROM user_roles;
DELETE FROM roles;

INSERT INTO roles (id, code, name, description) VALUES
  (1, 'admin',    'システム管理者',   '全権限。ユーザー管理・システム設定を含む'),
  (2, 'operator', 'オペレーター',     '発送業務の参照・更新が可能'),
  (3, 'viewer',   '閲覧者',          '発送情報の参照のみ'),
  (4, 'service',  'サービスアカウント', 'マイクロサービス間通信用 (M2M)');

-- ----- Permissions -----
DELETE FROM permissions;

INSERT INTO permissions (id, code, name, description) VALUES
  -- Shipping domain
  (1,  'shipping:create', '発送作成',       '新規発送レコードの作成'),
  (2,  'shipping:read',   '発送参照',       '発送一覧・詳細の参照'),
  (3,  'shipping:update', '発送更新',       '発送情報の更新（ステータス変更含む）'),
  (4,  'shipping:delete', '発送削除',       '発送レコードの論理削除'),
  -- User management
  (5,  'user:create',     'ユーザー作成',   'ユーザーアカウントの作成'),
  (6,  'user:read',       'ユーザー参照',   'ユーザー情報の参照'),
  (7,  'user:update',     'ユーザー更新',   'ユーザー情報の更新'),
  (8,  'user:delete',     'ユーザー削除',   'ユーザーアカウントの無効化'),
  -- System
  (9,  'system:config',   'システム設定',   'システム設定の変更'),
  (10, 'system:audit',    '監査ログ参照',   '監査ログの参照');

-- ----- Role ↔ Permission Mapping -----
-- ADR-008 Section 3.3: Role Definitions
--   admin    → shipping:*, user:*, system:*
--   operator → shipping:read, shipping:update
--   viewer   → shipping:read
--   service  → shipping:create, shipping:read (M2M用)

INSERT INTO role_permissions (role_id, permission_id) VALUES
  -- admin: 全権限
  (1, 1), (1, 2), (1, 3), (1, 4),   -- shipping:*
  (1, 5), (1, 6), (1, 7), (1, 8),   -- user:*
  (1, 9), (1, 10),                    -- system:*
  -- operator: shipping:read, shipping:update
  (2, 2), (2, 3),
  -- viewer: shipping:read
  (3, 2),
  -- service: shipping:create, shipping:read
  (4, 1), (4, 2);

-- ----- Users -----
-- パスワードはすべて bcrypt ハッシュ
-- デモ用パスワード一覧:
--   admin    → admin123     (bcrypt hash below)
--   operator → operator123
--   viewer   → viewer123
--   service  → service123
DELETE FROM users;

INSERT INTO users (id, username, password_hash, display_name, email, is_active, tenant_id) VALUES
  (1, 'admin',    '$2a$10$v9O2s8k6wOQis4M.kxU.juM2cH7kPKLPRNevCfI/GYq1E4kocLAz.', '管理者 太郎',   'admin@example.com',    1, 'default'),
  (2, 'operator', '$2a$10$ghZmYn8QxVjqxn/8dAdflu2mEhmnLQtTj2j6Z1.OBX0QMnk4Ww93u', 'オペ 花子',     'operator@example.com', 1, 'default'),
  (3, 'viewer',   '$2a$10$vIO8W5wvq.Jy8PWDBg0J6etdbymBvd9OueYVEeV2N/IsAwgBH3o4q', '閲覧 次郎',     'viewer@example.com',   1, 'default'),
  (4, 'service',  '$2a$10$tvC97aUNC5RonH2G9I6WdevmvihDH2vHV2fkMJBPfwjPAl6SYJAba', 'Order Service', 'service@example.com',  1, 'default');

-- ----- User ↔ Role Mapping -----
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1),  -- admin    → admin
  (2, 2),  -- operator → operator
  (3, 3),  -- viewer   → viewer
  (4, 4);  -- service  → service

-- ============================================================
-- 2. Shipping デモデータ (100件)
--    Status 分布: CREATED(20), READY(20), SHIPPED(30), DELIVERED(25), RETURNED(5)
--    Carrier 分布: YAMATO(~33%), SAGAWA(~33%), JAPAN_POST(~34%)
-- ============================================================

DELETE FROM shippings;

INSERT INTO shippings (order_id, status, carrier, tracking_number, shipping_address, ready_at, shipped_at, delivered_at, version) VALUES
  -- CREATED (20 records) - No carrier, no tracking
  ('ORD-001', 'CREATED', NULL, NULL, '〒150-0001 東京都渋谷区神宮前1-2-3 ABCビル 101', NULL, NULL, NULL, 1),
  ('ORD-002', 'CREATED', NULL, NULL, '〒160-0022 東京都新宿区新宿3-4-5 XYZマンション 202', NULL, NULL, NULL, 1),
  ('ORD-003', 'CREATED', NULL, NULL, '〒530-0001 大阪府大阪市北区梅田1-1-1 グランドタワー 1501', NULL, NULL, NULL, 1),
  ('ORD-004', 'CREATED', NULL, NULL, '〒460-0008 愛知県名古屋市中区栄2-3-4 セントラルビル 301', NULL, NULL, NULL, 1),
  ('ORD-005', 'CREATED', NULL, NULL, '〒812-0011 福岡県福岡市博多区博多駅前1-2-3 パークサイド 405', NULL, NULL, NULL, 1),
  ('ORD-006', 'CREATED', NULL, NULL, '〒980-0021 宮城県仙台市青葉区中央1-1-1 東北ビル 201', NULL, NULL, NULL, 1),
  ('ORD-007', 'CREATED', NULL, NULL, '〒060-0001 北海道札幌市中央区北1条西2-3 北海ビル 302', NULL, NULL, NULL, 1),
  ('ORD-008', 'CREATED', NULL, NULL, '〒730-0011 広島県広島市中区基町6-7-8 広島タワー 501', NULL, NULL, NULL, 1),
  ('ORD-009', 'CREATED', NULL, NULL, '〒760-0000 香川県高松市サンポート2-1 四国ビル 601', NULL, NULL, NULL, 1),
  ('ORD-010', 'CREATED', NULL, NULL, '〒850-0000 長崎県長崎市尾上町1-1 長崎センター 701', NULL, NULL, NULL, 1),
  ('ORD-011', 'CREATED', NULL, NULL, '〒870-0000 大分県大分市府内町1-2-3 大分プラザ 801', NULL, NULL, NULL, 1),
  ('ORD-012', 'CREATED', NULL, NULL, '〒890-0000 鹿児島県鹿児島市中央町4-5 鹿児島ビル 901', NULL, NULL, NULL, 1),
  ('ORD-013', 'CREATED', NULL, NULL, '〒900-0000 沖縄県那覇市久茂地1-1-1 沖縄タワー 1001', NULL, NULL, NULL, 1),
  ('ORD-014', 'CREATED', NULL, NULL, '〒310-0000 茨城県水戸市三の丸1-2-3 茨城ビル 101', NULL, NULL, NULL, 1),
  ('ORD-015', 'CREATED', NULL, NULL, '〒320-0000 栃木県宇都宮市本町5-6 栃木プラザ 201', NULL, NULL, NULL, 1),
  ('ORD-016', 'CREATED', NULL, NULL, '〒330-0000 埼玉県さいたま市浦和区高砂1-2 埼玉ビル 301', NULL, NULL, NULL, 1),
  ('ORD-017', 'CREATED', NULL, NULL, '〒260-0000 千葉県千葉市中央区中央1-1-1 千葉タワー 401', NULL, NULL, NULL, 1),
  ('ORD-018', 'CREATED', NULL, NULL, '〒220-0000 神奈川県横浜市西区みなとみらい2-2-1 横浜ビル 501', NULL, NULL, NULL, 1),
  ('ORD-019', 'CREATED', NULL, NULL, '〒950-0000 新潟県新潟市中央区東大通1-1 新潟センター 601', NULL, NULL, NULL, 1),
  ('ORD-020', 'CREATED', NULL, NULL, '〒920-0000 石川県金沢市広坂1-2-3 金沢プラザ 701', NULL, NULL, NULL, 1),

  -- READY (20 records)
  ('ORD-021', 'READY', NULL, NULL, '〒151-0000 東京都渋谷区代々木1-2-3 代々木ビル 102', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-022', 'READY', NULL, NULL, '〒100-0000 東京都千代田区丸の内1-1-1 丸ビル 202', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-023', 'READY', NULL, NULL, '〒541-0000 大阪府大阪市中央区本町3-4-5 本町ビル 302', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-024', 'READY', NULL, NULL, '〒450-0000 愛知県名古屋市中村区名駅1-1-1 名駅ビル 402', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, 1),
  ('ORD-025', 'READY', NULL, NULL, '〒810-0000 福岡県福岡市中央区天神1-2-3 天神ビル 502', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-026', 'READY', NULL, NULL, '〒600-0000 京都府京都市下京区四条通1-1 四条ビル 602', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-027', 'READY', NULL, NULL, '〒650-0000 兵庫県神戸市中央区三宮町1-2-3 神戸タワー 702', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, NULL, 1),
  ('ORD-028', 'READY', NULL, NULL, '〒700-0000 岡山県岡山市北区駅元町1-1 岡山ビル 802', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-029', 'READY', NULL, NULL, '〒790-0000 愛媛県松山市一番町1-2-3 松山プラザ 902', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-030', 'READY', NULL, NULL, '〒770-0000 徳島県徳島市幸町1-1 徳島センター 1002', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, 1),
  ('ORD-031', 'READY', NULL, NULL, '〒780-0000 高知県高知市本町1-2-3 高知ビル 103', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-032', 'READY', NULL, NULL, '〒840-0000 佐賀県佐賀市駅前中央1-1 佐賀タワー 203', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-033', 'READY', NULL, NULL, '〒860-0000 熊本県熊本市中央区花畑町1-2 熊本ビル 303', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, NULL, 1),
  ('ORD-034', 'READY', NULL, NULL, '〒880-0000 宮崎県宮崎市橘通東1-1-1 宮崎プラザ 403', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-035', 'READY', NULL, NULL, '〒400-0000 山梨県甲府市丸の内1-2-3 甲府ビル 503', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-036', 'READY', NULL, NULL, '〒380-0000 長野県長野市南長野1-1 長野センター 603', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, 1),
  ('ORD-037', 'READY', NULL, NULL, '〒500-0000 岐阜県岐阜市金町1-2-3 岐阜タワー 703', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),
  ('ORD-038', 'READY', NULL, NULL, '〒420-0000 静岡県静岡市葵区追手町1-1 静岡ビル 803', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, 1),
  ('ORD-039', 'READY', NULL, NULL, '〒410-0000 静岡県沼津市大手町1-2-3 沼津プラザ 903', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, NULL, 1),
  ('ORD-040', 'READY', NULL, NULL, '〒430-0000 静岡県浜松市中区中央1-1 浜松ビル 1003', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 1),

  -- SHIPPED (30 records)
  ('ORD-041', 'SHIPPED', 'YAMATO', 'YM100000001', '〒106-0000 東京都港区六本木1-2-3 六本木ヒルズ 104', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL, 2),
  ('ORD-042', 'SHIPPED', 'SAGAWA', 'SG200000001', '〒550-0000 大阪府大阪市西区新町1-1-1 新町ビル 204', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NULL, 2),
  ('ORD-043', 'SHIPPED', 'JAPAN_POST', 'JP300000001', '〒461-0000 愛知県名古屋市東区東桜1-2-3 東桜ビル 304', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL, 2),
  ('ORD-044', 'SHIPPED', 'YAMATO', 'YM100000002', '〒812-0000 福岡県福岡市博多区博多駅東1-1 博多ビル 404', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NULL, 2),
  ('ORD-045', 'SHIPPED', 'SAGAWA', 'SG200000002', '〒980-0000 宮城県仙台市青葉区一番町1-2-3 一番町ビル 504', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NULL, 2),
  ('ORD-046', 'SHIPPED', 'JAPAN_POST', 'JP300000002', '〒060-0000 北海道札幌市北区北7条西1-1 北7条ビル 604', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW(), NULL, 2),
  ('ORD-047', 'SHIPPED', 'YAMATO', 'YM100000003', '〒730-0000 広島県広島市中区紙屋町1-2-3 紙屋町ビル 704', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL, 2),
  ('ORD-048', 'SHIPPED', 'SAGAWA', 'SG200000003', '〒760-0000 香川県高松市丸の内1-1 丸の内ビル 804', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NULL, 2),
  ('ORD-049', 'SHIPPED', 'JAPAN_POST', 'JP300000003', '〒850-0000 長崎県長崎市浜町1-2-3 浜町ビル 904', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NULL, 2),
  ('ORD-050', 'SHIPPED', 'YAMATO', 'YM100000004', '〒870-0000 大分県大分市中央町1-1 中央町ビル 1004', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL, 2),
  ('ORD-051', 'SHIPPED', 'SAGAWA', 'SG200000004', '〒152-0000 東京都目黒区自由が丘1-2-3 自由が丘ビル 105', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NULL, 2),
  ('ORD-052', 'SHIPPED', 'JAPAN_POST', 'JP300000004', '〒231-0000 神奈川県横浜市中区山下町1-1 山下町ビル 205', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL, 2),
  ('ORD-053', 'SHIPPED', 'YAMATO', 'YM100000005', '〒602-0000 京都府京都市上京区今出川通1-2-3 今出川ビル 305', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NULL, 2),
  ('ORD-054', 'SHIPPED', 'SAGAWA', 'SG200000005', '〒651-0000 兵庫県神戸市中央区元町通1-1 元町ビル 405', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NULL, 2),
  ('ORD-055', 'SHIPPED', 'JAPAN_POST', 'JP300000005', '〒630-0000 奈良県奈良市登大路町1-2-3 登大路ビル 505', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 2),
  ('ORD-056', 'SHIPPED', 'YAMATO', 'YM100000006', '〒640-0000 和歌山県和歌山市小松原通1-1 小松原ビル 605', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 2),
  ('ORD-057', 'SHIPPED', 'SAGAWA', 'SG200000006', '〒680-0000 鳥取県鳥取市東町1-2-3 東町ビル 705', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 2),
  ('ORD-058', 'SHIPPED', 'JAPAN_POST', 'JP300000006', '〒690-0000 島根県松江市殿町1-1 殿町ビル 805', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 2),
  ('ORD-059', 'SHIPPED', 'YAMATO', 'YM100000007', '〒710-0000 岡山県倉敷市阿知1-2-3 阿知ビル 905', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 2),
  ('ORD-060', 'SHIPPED', 'SAGAWA', 'SG200000007', '〒753-0000 山口県山口市中央1-1 中央ビル 1005', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 2),
  ('ORD-061', 'SHIPPED', 'JAPAN_POST', 'JP300000007', '〒790-0000 愛媛県今治市片原町1-2-3 片原町ビル 106', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 2),
  ('ORD-062', 'SHIPPED', 'YAMATO', 'YM100000008', '〒770-0000 徳島県阿南市富岡町1-1 富岡町ビル 206', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, 2),
  ('ORD-063', 'SHIPPED', 'SAGAWA', 'SG200000008', '〒780-0000 高知県南国市駅前町1-2-3 駅前町ビル 306', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 2),
  ('ORD-064', 'SHIPPED', 'JAPAN_POST', 'JP300000008', '〒810-0000 福岡県北九州市小倉北区魚町1-1 魚町ビル 406', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 2),
  ('ORD-065', 'SHIPPED', 'YAMATO', 'YM100000009', '〒841-0000 佐賀県鳥栖市本町1-2-3 本町ビル 506', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 2),
  ('ORD-066', 'SHIPPED', 'SAGAWA', 'SG200000009', '〒861-0000 熊本県合志市御代志1-1 御代志ビル 606', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 2),
  ('ORD-067', 'SHIPPED', 'JAPAN_POST', 'JP300000009', '〒871-0000 大分県中津市中央町1-2-3 中央町ビル 706', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 2),
  ('ORD-068', 'SHIPPED', 'YAMATO', 'YM100000010', '〒881-0000 宮崎県西都市聖陵町1-1 聖陵町ビル 806', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 2),
  ('ORD-069', 'SHIPPED', 'SAGAWA', 'SG200000010', '〒891-0000 鹿児島県鹿屋市北田町1-2-3 北田町ビル 906', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 2),
  ('ORD-070', 'SHIPPED', 'JAPAN_POST', 'JP300000010', '〒901-0000 沖縄県豊見城市田頭1-1 田頭ビル 1006', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 2),

  -- DELIVERED (25 records)
  ('ORD-071', 'DELIVERED', 'YAMATO', 'YM100000011', '〒107-0000 東京都港区赤坂1-2-3 赤坂ビル 107', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-072', 'DELIVERED', 'SAGAWA', 'SG200000011', '〒542-0000 大阪府大阪市中央区心斎橋1-1 心斎橋ビル 207', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),
  ('ORD-073', 'DELIVERED', 'JAPAN_POST', 'JP300000011', '〒464-0000 愛知県名古屋市千種区今池1-2-3 今池ビル 307', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  ('ORD-074', 'DELIVERED', 'YAMATO', 'YM100000012', '〒815-0000 福岡県福岡市南区大橋1-1 大橋ビル 407', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), 3),
  ('ORD-075', 'DELIVERED', 'SAGAWA', 'SG200000012', '〒981-0000 宮城県仙台市青葉区本町1-2-3 本町ビル 507', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), 3),
  ('ORD-076', 'DELIVERED', 'JAPAN_POST', 'JP300000012', '〒061-0000 北海道札幌市西区宮の沢1-1 宮の沢ビル 607', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-077', 'DELIVERED', 'YAMATO', 'YM100000013', '〒731-0000 広島県広島市安佐南区中筋1-2-3 中筋ビル 707', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),
  ('ORD-078', 'DELIVERED', 'SAGAWA', 'SG200000013', '〒761-0000 香川県高松市木太町1-1 木太町ビル 807', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 3),
  ('ORD-079', 'DELIVERED', 'JAPAN_POST', 'JP300000013', '〒852-0000 長崎県長崎市栄町1-2-3 栄町ビル 907', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  ('ORD-080', 'DELIVERED', 'YAMATO', 'YM100000014', '〒870-0000 大分県大分市明野1-1 明野ビル 1007', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-081', 'DELIVERED', 'SAGAWA', 'SG200000014', '〒153-0000 東京都目黒区上目黒1-2-3 上目黒ビル 108', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY), 3),
  ('ORD-082', 'DELIVERED', 'JAPAN_POST', 'JP300000014', '〒232-0000 神奈川県横浜市南区井土ヶ谷1-1 井土ヶ谷ビル 208', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),
  ('ORD-083', 'DELIVERED', 'YAMATO', 'YM100000015', '〒603-0000 京都府京都市北区紫野1-2-3 紫野ビル 308', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  ('ORD-084', 'DELIVERED', 'SAGAWA', 'SG200000015', '〒652-0000 兵庫県神戸市兵庫区新開地1-1 新開地ビル 408', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 3),
  ('ORD-085', 'DELIVERED', 'JAPAN_POST', 'JP300000015', '〒631-0000 奈良県奈良市学園前1-2-3 学園前ビル 508', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-086', 'DELIVERED', 'YAMATO', 'YM100000016', '〒641-0000 和歌山県和歌山市和歌浦1-1 和歌浦ビル 608', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),
  ('ORD-087', 'DELIVERED', 'SAGAWA', 'SG200000016', '〒681-0000 鳥取県倉吉市昭和町1-2-3 昭和町ビル 708', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), 3),
  ('ORD-088', 'DELIVERED', 'JAPAN_POST', 'JP300000016', '〒691-0000 島根県出雲市今市町1-1 今市町ビル 808', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  ('ORD-089', 'DELIVERED', 'YAMATO', 'YM100000017', '〒711-0000 岡山県倉敷市児島1-2-3 児島ビル 908', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-090', 'DELIVERED', 'SAGAWA', 'SG200000017', '〒754-0000 山口県山口市小郡1-1 小郡ビル 1008', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), 3),
  ('ORD-091', 'DELIVERED', 'JAPAN_POST', 'JP300000017', '〒791-0000 愛媛県松山市道後1-2-3 道後ビル 109', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),
  ('ORD-092', 'DELIVERED', 'YAMATO', 'YM100000018', '〒771-0000 徳島県徳島市南昭和町1-1 南昭和町ビル 209', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 3),
  ('ORD-093', 'DELIVERED', 'SAGAWA', 'SG200000018', '〒781-0000 高知県高知市旭町1-2-3 旭町ビル 309', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), 3),
  ('ORD-094', 'DELIVERED', 'JAPAN_POST', 'JP300000018', '〒811-0000 福岡県福岡市東区香椎1-1 香椎ビル 409', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 3),
  ('ORD-095', 'DELIVERED', 'YAMATO', 'YM100000019', '〒842-0000 佐賀県神埼市神埼町1-2-3 神埼町ビル 509', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), 3),

  -- RETURNED (5 records)
  ('ORD-096', 'RETURNED', 'YAMATO', 'YM100000020', '〒108-0000 東京都港区芝浦1-2-3 芝浦ビル 110', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 3),
  ('ORD-097', 'RETURNED', 'SAGAWA', 'SG200000019', '〒543-0000 大阪府大阪市天王寺区上本町1-1 上本町ビル 210', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 3),
  ('ORD-098', 'RETURNED', 'JAPAN_POST', 'JP300000019', '〒465-0000 愛知県名古屋市名東区藤が丘1-2-3 藤が丘ビル 310', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 3),
  ('ORD-099', 'RETURNED', 'YAMATO', 'YM100000021', '〒816-0000 福岡県春日市春日公園1-1 春日公園ビル 410', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY), NULL, 3),
  ('ORD-100', 'RETURNED', 'SAGAWA', 'SG200000020', '〒982-0000 宮城県仙台市太白区長町1-2-3 長町ビル 510', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, 3);
