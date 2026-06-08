#!/usr/bin/env bash
# =============================================================================
#  toefl/ klasörünü AYRI bir repo olarak yayınlamaya hazırlar.
#  Kullanım (toefl/ klasörünün içinden çalıştır):
#     bash publish.sh [repo-adi]      # varsayılan: toefl-hazirlik
#  Script, üst dizinde standalone bir kopya oluşturur ve git'i hazırlar.
#  Sonra sadece GitHub'da boş repoyu açıp 'git push' demen yeterli.
# =============================================================================
set -e
NAME="${1:-toefl-hazirlik}"
SRC="$(pwd)"
DEST="$(cd .. && pwd)/$NAME"

echo "→ Standalone kopya hazırlanıyor: $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
# kaynak dosyaları kopyala (geçici/db dosyaları hariç)
cp -r "$SRC/." "$DEST/"
cd "$DEST"
rm -rf .git backend/__pycache__ backend/toefl.db backend/toefl.db-wal backend/toefl.db-shm

# Bu repoda toefl/ artık KÖK olduğu için Render rootDir'i düzelt: toefl/backend -> backend
if [ -f backend/render.yaml ]; then
  sed -i.bak 's#rootDir: toefl/backend#rootDir: backend#' backend/render.yaml && rm -f backend/render.yaml.bak
fi

git init -q
git add .
git commit -qm "TOEFL Structure platformu (standalone)"
git branch -M main

echo ""
echo "✅ Hazır: $DEST"
echo ""
echo "Şimdi şunları yap:"
echo "  1) https://github.com/new → repo adı: $NAME (boş bırak, README ekleme)"
echo "  2) Aşağıdaki komutları çalıştır (KULLANICI yerine GitHub kullanıcı adın):"
echo ""
echo "     cd \"$DEST\""
echo "     git remote add origin https://github.com/KULLANICI/$NAME.git"
echo "     git push -u origin main"
echo ""
echo "  3) Canlıya çekmek için backend/DEPLOY.md'yi izle (Railway root dir = backend)."
