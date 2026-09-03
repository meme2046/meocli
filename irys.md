# IRYS

1. 充值: `pnpm run dev irys fund 10 -e "d:/irys.env" -n mainnet -t POL`
2. 查询余额: `pnpm run dev irys balance -e d:/irys.env -t POL`
3. me上传: `pnpm run dev irys upload "d:/.google/assets/audiobook/favicon.ico" -e d:/irys.env -t POL`
4. 价格查询(1GB) `pnpm run dev irys price 1073741824 --token pol --env d:/irys.env`

# Script

1. 上传脚本: `nu irys.nu ud`
