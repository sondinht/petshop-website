export type SeedReview = {
  rating: number;
  title: string;
  body: string;
  authorName: string;
};

export const productReviewsByName: Record<string, SeedReview[]> = {
  "Premium Grain-Free Kibble": [
    {
      rating: 5,
      title: "Noticeable energy boost",
      body: "Our border collie adjusted in two days and now clears her bowl every meal.",
      authorName: "Mia R."
    },
    {
      rating: 4,
      title: "Great, but pricey",
      body: "Quality is high and digestion improved, I just buy the larger bag when it is in stock.",
      authorName: "Devon K."
    }
  ],
  "Indestructible Rubber Bone": [
    {
      rating: 4,
      title: "Actually survives chewing",
      body: "Our lab usually destroys toys fast, this one has held up for weeks.",
      authorName: "Jon P."
    }
  ],
  "Orthopedic Memory Foam Bed": [
    {
      rating: 5,
      title: "Senior dog approved",
      body: "He stopped pacing at night and goes straight to this bed now.",
      authorName: "Celine W."
    }
  ],
  "Adjustable Leather Harness": [
    {
      rating: 4,
      title: "Solid fit and easy clips",
      body: "Leather feels sturdy and the chest adjustment finally fits our narrow pup.",
      authorName: "Ari N."
    }
  ],
  "Calming Hemp Treats": [
    {
      rating: 3,
      title: "Mild effect for us",
      body: "It takes the edge off before car rides, but it is not a miracle fix.",
      authorName: "Trent S."
    }
  ],
  "Waterproof Raincoat": [
    {
      rating: 4,
      title: "Keeps fur dry",
      body: "Good coverage in light rain and the reflective trim is a nice touch.",
      authorName: "Paula D."
    }
  ],
  "Wild Ocean Cat Grain": [
    {
      rating: 5,
      title: "Picky cat finally eats",
      body: "Tried three brands before this one and now there is no leftover food.",
      authorName: "Nina T."
    }
  ],
  "Tan Leather Collar": [
    {
      rating: 4,
      title: "Looks premium",
      body: "Hardware feels durable and the color still looks good after daily walks.",
      authorName: "Marco L."
    }
  ],
  "Velvet Orthopedic Bed": [
    {
      rating: 5,
      title: "Worth the upgrade",
      body: "Very soft top fabric and enough support that our older shepherd gets up easier.",
      authorName: "Imani G."
    }
  ]
};

export const storeFallbackReviews: SeedReview[] = [
  {
    rating: 5,
    title: "Consistent delivery",
    body: "Orders keep arriving on schedule and items match the photos.",
    authorName: "Kelly M."
  },
  {
    rating: 4,
    title: "Helpful support team",
    body: "A sizing question was answered quickly and the recommendation was accurate.",
    authorName: "Ravi B."
  },
  {
    rating: 4,
    title: "Reliable quality",
    body: "Not every item is perfect, but overall quality has been dependable for our pets.",
    authorName: "Sora H."
  }
];
