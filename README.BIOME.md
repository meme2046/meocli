# 格式化单个文件（使用内置配置）

pnpm run dev biome ./tmp/test.json

# 自定义配置

me biome ./src/file.tsx --config ./biome.json

# 自动检测项目配置

me biome ./src/file.tsx --config auto

# 重置配置

me biome reset

# 详细输出

me biome ./src/file.tsx -v
