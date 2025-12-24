export const TAG_OPTIONS = [
  "技术",
  "AI",
  "生活",
  "职场",
  "效率",
  "设计",
  "编程",
  "写作",
  "投资",
  "教育",
  "创业",
  "读书"
] as const;

export type ShowcaseTag = typeof TAG_OPTIONS[number];

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
    desc: "inBox 笔记 作者 | 独立开发者 | AI 编程实践者",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766454315805_image.png",
    qrcode: "https://gudong.s3.bitiful.net/asset/gongzhonghao.jpg",
    tags: ["AI", "生活"]
  },
  {
    name: "认知凤凰社",
    desc: "磁共振相关知识，认知提升，一人公司手记",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766458023391_image.png",
    qrcode: "https://gudong.s3.bitiful.net/weimd/1766541641354_image.png",
    tags: ["技术", "生活"]
  },
  {
    name: "胖子说AI",
    desc: "教会普通人使用AI，分享AI书签、技巧和教程。收集国内外A网站和资源。",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766458041800_image.png",
    qrcode: "https://gudong.s3.bitiful.net/weimd/1766458056167_image.png",
    tags: ["技术", "生活"]
  },
  {
    name: "张大名",
    desc: "all in AI 和心学 内置AI心学大师助手 欢迎对话沟通",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766542030069_image.png",
    qrcode: "https://gudong.s3.bitiful.net/weimd/1766542025128_image.png",
    tags: ["AI", "读书"]
  },
  {
    name: "洛卡洛",
    desc: "分享企业运行中的心得体会。注册安全工程师/经济师/咨询工程师/211",
    avatar: "https://gudong.s3.bitiful.net/weimd/1766542074339_image.png",
    qrcode: "",
    tags: ["技术", "写作", "旅游"]
  }

];
