import type { ProductCategory } from "../../src/server/productTypes";

export type SeedProduct = {
  id: string;
  publicId: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  images?: string[];
};

export const seedProducts: SeedProduct[] = [
  {
    id: "dogs-kibble-premium",
    publicId: "dogs-kibble-premium",
    name: "Premium Grain-Free Kibble",
    price: 64.99,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCq7fRkBOhsz4doOmogbepHHV0Y9ly2mh5jV3PLUsFJhACTdqFle_-ey1OI6Zbg9GG5laesnu6dLG4DAPUgtx4Inyvj8MDbXlhu4CWZaS20wuHp9cZlwHJwPBSJJ04PVYJYqLZPzRQIMBG4OHW8q54yJrtO2mxbRIIS0k4au0M_fv2dBu_VdZ7DBcG_wP-a_kDxYkJncw0MemGkSZktvAqoLv3CLTEcmrJBRMpE_Ed4twXxX2YqGYlH6pbSkOQy-IPHoWpQcwMxp3a7"
  },
  {
    id: "dogs-bone-indestructible",
    publicId: "dogs-bone-indestructible",
    name: "Indestructible Rubber Bone",
    price: 18.5,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpzH5EfJbunUXGoCTyuYZo84vaa2wZE_Efb00mmEKbufZyyhHDwDtU6kNt38ccp7WrrFooLyBHT6v-TMHJ6q81LWawpQAS6N7hPKIn6L2LDJFaKxgLWD4PEmemhvdtd4OW-baTyxXkVzJ0_DM_qKbqyjQrDghUmtLAtePTzZ5tF62JoBGnsOEoINDdoQr2OuKq09McAxfUq6PVo4pJqJNgkPWOjpX8J_O2E7COdEXfMaBVnAA-Pf-m0fg90E8LogJf3ANKXMjdF9Ek"
  },
  {
    id: "dogs-bed-orthopedic",
    publicId: "dogs-bed-orthopedic",
    name: "Orthopedic Memory Foam Bed",
    price: 129,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu9-Wm28oU_bBhrn5HrlPjW2ncGFj-MPMqANI80H3hglq0ghIU02PH3hIKlJZgmVpLHL_LCA1SNDolHinZkCzkOaTMXoqTecZHr-rSrwo0f1IuW15zg_oSb97zOHgA1jKcm4zzG88FmBOufbm2etmDYcnKimUmpxANe9H3GIssm8ozTGUFVYIrr8dmzoWg_4De7L4rALQJV8TXDzJa5Z-t6BAGIUmQs5WRvPWNOKp_GjgUJSClGCyECg0wzJ3Bd8LEnE8abg9vfzdF"
  },
  {
    id: "dogs-harness-leather",
    publicId: "dogs-harness-leather",
    name: "Adjustable Leather Harness",
    price: 42,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9E-zg3VgEWA81JxuBAVIrx8rbf98NekOdIO-OynVYrG6f3-oC-64iFQbRs8dicQCDlHZI9aQ2aNJpz3HTGgz9AEyRl7c1jJf0sdL8kqoTXZpdKN3F2WltAX_P-B05hxada7IoEuKhFjj-3eqgtJo_H3lUt7z71P1W6R4IZ-7VQpNoyS5KPDq0ZagpIK3m-UB5DDED7mqnA10Ht87Uk98LjCVtuD5J9DjdJwTizYf0nde5M-y2pKBgJd3tfZSWTXrpMH7-B6S7flqU"
  },
  {
    id: "dogs-hemp-treats",
    publicId: "dogs-hemp-treats",
    name: "Calming Hemp Treats",
    price: 24.95,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4-6Zti1zk08j7miyafXeTBg-usY4QlW4DVoIWOUdtgaAh1xNoaJtF3Ze60N_J4zYCcKSW-eDOUUd2PdFJZb2F199FAFuLPLnTx6rUEGhNaa3icm259okozllmlyQZlD9G-bo8JMAIHjZVjoajPDUrhJvXSui3m68QmanCyg8TPsAS2XIEH6pgb8WyKRAq-dFIkM4PO6rehwtZv-VcIxd1ERnn17YaHCUGoe1b4pWUXffIyGNzdyPx_V201JLW4P_I6a03MMhgoMpB"
  },
  {
    id: "dogs-raincoat",
    publicId: "dogs-raincoat",
    name: "Waterproof Raincoat",
    price: 32,
    category: "dogs",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCynmpkXS-lByIBRlxTF8DfIm2O9CkBoWePlrWqgDq18vnlQWfUhDHGS9fXhE8zRFNZdyv5Glyi5X-XganFRQXgKX_O9vQEOk2sYMOeKCXZ0QTtc2avB1L-AQYxdnU_IHb6lgHd1Q4JYIxIFx6x-ynAvVfzt9B3rLivp3gRnif57ZMW7gRDWw2MSoi1erALWnE0LiTG9Jhpxw3ZoRkVzb9Rj9J1XCvlm9BsvkAotTi_V-b6JnewJkJLq-uDPCLMk6Ff6fdtpDhq2nMm"
  },
  {
    id: "cats-ocean-grain",
    publicId: "cats-ocean-grain",
    name: "Wild Ocean Cat Grain",
    price: 45,
    category: "cats",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHlSkYPMl2-m5Jk3GPhQufw8U2hjAhN989QP_OtMTn1LQUHP80j6H0QldZXJNnZc4i5uOj0Z50HrfJaQCkN4aFB5lobEOeDNjs467fGg1kGEwh0gfGqRRWtGwR76d1oHhW-bdGbM_qW-o2aAPLMTJCp3RIeGtCe2LWiASeIMAjClaJgGDYS1Lhud-8ngnZ0iZJ3c37M5UlVbPIOwRNxBXqEkl47shHx30iaHHpVjLXXdIx2TlJ_hcnmogvhSvrj5IYIxHhDVV2XuaJ"
  },
  {
    id: "accessories-collar-tan",
    publicId: "accessories-collar-tan",
    name: "Tan Leather Collar",
    price: 15,
    category: "accessories",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtY1kSfXkIyAMJjdakLF6b6NoE_0G1pYzyvwmIEOG9y83hypEcefjN0joLHIAXzwjILrkB3B7YxLIcElPPoDd1EduBF-EEqcXl-V1RxXkJEau8XBTESyVbMzi4WiJCk0NNW2L9Uuvfr38qHAlJY6kstcHZxdrnmh_bmrn-y5Ge21NniqPyIyPHOAqaRRizETMb3jKFRvlN9l1UZbgJ7Be0tBNwuCJoN5002yQb8bZo7tkSkUV611Pjgf_NHh3bsmfVG3X5_6hgk41H"
  },
  {
    id: "deals-bed-velvet",
    publicId: "deals-bed-velvet",
    name: "Velvet Orthopedic Bed",
    price: 89,
    category: "deals",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDrbWGlI2QemlNgkpifb41G9Ae2_UuWzejDq7lIKolG5R6_y8V2elbT8juZJEQ2pnQxGDVVSYPDaZ8qvsWu_aR793OySVSBM2LpXeXEaDaYPGONW0qAtBfg6Qs31L-YdlCdtemB7YqVk-LJCl0e2TQCmqwC1M0tkgQqvesQrW3K9lrDHniOC7x8TOD4Cru6SDcCCYFJ-iX89bY_5YkyhJkIeGutsnLLXsAAg17Qt2LrESW2yjVt3kAFtbUI0HROMwxVHXoPvvo26ZF"
  }
];