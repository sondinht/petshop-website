import type { ProductCategory } from "../../src/server/productTypes";

export type SeedProduct = {
  name: string;
  price: number;
  category: ProductCategory;
  storefrontPages?: ProductCategory[];
  image: string;
  images?: string[];
  dogLifeStage?: string;
  dogBreedSize?: string;
  catAge?: string;
  catType?: string;
  variants?: Array<{
    name: string;
    price: number;
    originalPrice?: number | null;
    stockQty?: number | null;
    enabled?: boolean;
    sortOrder?: number;
  }>;
};

export const seedProducts: SeedProduct[] = [
  {
    name: "Premium Grain-Free Kibble",
    price: 64.99,
    category: "dogs",
    storefrontPages: ["dogs"],
    dogLifeStage: "Adult",
    dogBreedSize: "Medium",
    variants: [
      { name: "15 lb", price: 64.99, originalPrice: 74.99, stockQty: 34, sortOrder: 0 },
      { name: "30 lb", price: 109.99, originalPrice: 124.99, stockQty: 19, sortOrder: 1 },
      { name: "50 lb", price: 149.99, originalPrice: 169.99, stockQty: 11, sortOrder: 2 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCq7fRkBOhsz4doOmogbepHHV0Y9ly2mh5jV3PLUsFJhACTdqFle_-ey1OI6Zbg9GG5laesnu6dLG4DAPUgtx4Inyvj8MDbXlhu4CWZaS20wuHp9cZlwHJwPBSJJ04PVYJYqLZPzRQIMBG4OHW8q54yJrtO2mxbRIIS0k4au0M_fv2dBu_VdZ7DBcG_wP-a_kDxYkJncw0MemGkSZktvAqoLv3CLTEcmrJBRMpE_Ed4twXxX2YqGYlH6pbSkOQy-IPHoWpQcwMxp3a7"
  },
  {
    name: "Indestructible Rubber Bone",
    price: 18.5,
    category: "dogs",
    storefrontPages: ["dogs"],
    dogLifeStage: "Adult",
    dogBreedSize: "Medium",
    variants: [
      { name: "Standard", price: 18.5, originalPrice: 21.99, stockQty: 62, sortOrder: 0 },
      { name: "Large", price: 24.5, originalPrice: 28.99, stockQty: 41, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpzH5EfJbunUXGoCTyuYZo84vaa2wZE_Efb00mmEKbufZyyhHDwDtU6kNt38ccp7WrrFooLyBHT6v-TMHJ6q81LWawpQAS6N7hPKIn6L2LDJFaKxgLWD4PEmemhvdtd4OW-baTyxXkVzJ0_DM_qKbqyjQrDghUmtLAtePTzZ5tF62JoBGnsOEoINDdoQr2OuKq09McAxfUq6PVo4pJqJNgkPWOjpX8J_O2E7COdEXfMaBVnAA-Pf-m0fg90E8LogJf3ANKXMjdF9Ek"
  },
  {
    name: "Orthopedic Memory Foam Bed",
    price: 129,
    category: "dogs",
    storefrontPages: ["dogs"],
    dogLifeStage: "Senior",
    dogBreedSize: "Large",
    variants: [
      { name: "Medium", price: 129, originalPrice: 159, stockQty: 8, sortOrder: 0 },
      { name: "Large", price: 159, originalPrice: 189, stockQty: 5, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu9-Wm28oU_bBhrn5HrlPjW2ncGFj-MPMqANI80H3hglq0ghIU02PH3hIKlJZgmVpLHL_LCA1SNDolHinZkCzkOaTMXoqTecZHr-rSrwo0f1IuW15zg_oSb97zOHgA1jKcm4zzG88FmBOufbm2etmDYcnKimUmpxANe9H3GIssm8ozTGUFVYIrr8dmzoWg_4De7L4rALQJV8TXDzJa5Z-t6BAGIUmQs5WRvPWNOKp_GjgUJSClGCyECg0wzJ3Bd8LEnE8abg9vfzdF"
  },
  {
    name: "Adjustable Leather Harness",
    price: 42,
    category: "dogs",
    storefrontPages: ["dogs", "accessories"],
    dogLifeStage: "Adult",
    dogBreedSize: "Medium",
    variants: [
      { name: "Small", price: 42, originalPrice: 49, stockQty: 27, sortOrder: 0 },
      { name: "Large", price: 49, originalPrice: 56, stockQty: 18, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9E-zg3VgEWA81JxuBAVIrx8rbf98NekOdIO-OynVYrG6f3-oC-64iFQbRs8dicQCDlHZI9aQ2aNJpz3HTGgz9AEyRl7c1jJf0sdL8kqoTXZpdKN3F2WltAX_P-B05hxada7IoEuKhFjj-3eqgtJo_H3lUt7z71P1W6R4IZ-7VQpNoyS5KPDq0ZagpIK3m-UB5DDED7mqnA10Ht87Uk98LjCVtuD5J9DjdJwTizYf0nde5M-y2pKBgJd3tfZSWTXrpMH7-B6S7flqU"
  },
  {
    name: "Calming Hemp Treats",
    price: 24.95,
    category: "dogs",
    storefrontPages: ["dogs"],
    dogLifeStage: "Adult",
    dogBreedSize: "Small",
    variants: [
      { name: "8 oz", price: 24.95, originalPrice: 29.95, stockQty: 46, sortOrder: 0 },
      { name: "16 oz", price: 39.95, originalPrice: 45.95, stockQty: 28, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4-6Zti1zk08j7miyafXeTBg-usY4QlW4DVoIWOUdtgaAh1xNoaJtF3Ze60N_J4zYCcKSW-eDOUUd2PdFJZb2F199FAFuLPLnTx6rUEGhNaa3icm259okozllmlyQZlD9G-bo8JMAIHjZVjoajPDUrhJvXSui3m68QmanCyg8TPsAS2XIEH6pgb8WyKRAq-dFIkM4PO6rehwtZv-VcIxd1ERnn17YaHCUGoe1b4pWUXffIyGNzdyPx_V201JLW4P_I6a03MMhgoMpB"
  },
  {
    name: "Waterproof Raincoat",
    price: 32,
    category: "dogs",
    storefrontPages: ["dogs"],
    dogLifeStage: "Adult",
    dogBreedSize: "Large",
    variants: [
      { name: "Medium", price: 32, originalPrice: 38, stockQty: 23, sortOrder: 0 },
      { name: "Large", price: 38, originalPrice: 44, stockQty: 14, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCynmpkXS-lByIBRlxTF8DfIm2O9CkBoWePlrWqgDq18vnlQWfUhDHGS9fXhE8zRFNZdyv5Glyi5X-XganFRQXgKX_O9vQEOk2sYMOeKCXZ0QTtc2avB1L-AQYxdnU_IHb6lgHd1Q4JYIxIFx6x-ynAvVfzt9B3rLivp3gRnif57ZMW7gRDWw2MSoi1erALWnE0LiTG9Jhpxw3ZoRkVzb9Rj9J1XCvlm9BsvkAotTi_V-b6JnewJkJLq-uDPCLMk6Ff6fdtpDhq2nMm"
  },
  {
    name: "Wild Ocean Cat Grain",
    price: 45,
    category: "cats",
    storefrontPages: ["cats"],
    catAge: "Adult",
    catType: "Dry Food",
    variants: [
      { name: "3 lb", price: 45, originalPrice: 52, stockQty: 31, sortOrder: 0 },
      { name: "7 lb", price: 74, originalPrice: 84, stockQty: 17, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHlSkYPMl2-m5Jk3GPhQufw8U2hjAhN989QP_OtMTn1LQUHP80j6H0QldZXJNnZc4i5uOj0Z50HrfJaQCkN4aFB5lobEOeDNjs467fGg1kGEwh0gfGqRRWtGwR76d1oHhW-bdGbM_qW-o2aAPLMTJCp3RIeGtCe2LWiASeIMAjClaJgGDYS1Lhud-8ngnZ0iZJ3c37M5UlVbPIOwRNxBXqEkl47shHx30iaHHpVjLXXdIx2TlJ_hcnmogvhSvrj5IYIxHhDVV2XuaJ"
  },
  {
    name: "Tan Leather Collar",
    price: 15,
    category: "accessories",
    storefrontPages: ["accessories"],
    variants: [
      { name: "Small", price: 15, originalPrice: 19, stockQty: 52, sortOrder: 0 },
      { name: "Medium", price: 18, originalPrice: 22, stockQty: 39, sortOrder: 1 },
      { name: "Large", price: 21, originalPrice: 25, stockQty: 29, sortOrder: 2 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtY1kSfXkIyAMJjdakLF6b6NoE_0G1pYzyvwmIEOG9y83hypEcefjN0joLHIAXzwjILrkB3B7YxLIcElPPoDd1EduBF-EEqcXl-V1RxXkJEau8XBTESyVbMzi4WiJCk0NNW2L9Uuvfr38qHAlJY6kstcHZxdrnmh_bmrn-y5Ge21NniqPyIyPHOAqaRRizETMb3jKFRvlN9l1UZbgJ7Be0tBNwuCJoN5002yQb8bZo7tkSkUV611Pjgf_NHh3bsmfVG3X5_6hgk41H"
  },
  {
    name: "Velvet Orthopedic Bed",
    price: 89,
    category: "deals",
    storefrontPages: ["deals", "dogs"],
    dogLifeStage: "Adult",
    dogBreedSize: "Large",
    variants: [
      { name: "Medium", price: 89, originalPrice: 109, stockQty: 16, sortOrder: 0 },
      { name: "Large", price: 119, originalPrice: 139, stockQty: 10, sortOrder: 1 }
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDrbWGlI2QemlNgkpifb41G9Ae2_UuWzejDq7lIKolG5R6_y8V2elbT8juZJEQ2pnQxGDVVSYPDaZ8qvsWu_aR793OySVSBM2LpXeXEaDaYPGONW0qAtBfg6Qs31L-YdlCdtemB7YqVk-LJCl0e2TQCmqwC1M0tkgQqvesQrW3K9lrDHniOC7x8TOD4Cru6SDcCCYFJ-iX89bY_5YkyhJkIeGutsnLLXsAAg17Qt2LrESW2yjVt3kAFtbUI0HROMwxVHXoPvvo26ZF"
  }
];