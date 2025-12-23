export interface ShowcaseUser {
  name: string;
  desc: string;
  avatar: string;
  qrcode: string;
  tags?: string[];
}

export const showcaseUsers: ShowcaseUser[] = [
  {
    name: "咕咚同学",
    desc: "inBox笔记作者，独立开发者，探索对话编程新范式",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766454315805_image.png",
    qrcode: "https://gudong.s3.bitiful.net/asset/gongzhonghao.jpg",
    tags: ["技术", "生活"]
  }
];
