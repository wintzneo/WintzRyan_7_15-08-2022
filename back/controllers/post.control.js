//Package file system pour modifier le système de donnée pour la fonction delete
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//Création d'un post
exports.create = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const data = {
      title,
      content,
      user: {
        connect: { id: userId },
      },
    };

    if (req.file) {
      data.image = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }

    const post = await prisma.post.create({
      data,
    });
    res.status(200).json({
      status: true,
      message: "Post created !",
      data: post,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

//Modifier un post
exports.updatePost = async (req, res) => {
  const post = await prisma.post.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!post) {
    return res.status(404).json({
      message: "not found",
    });
  }
  if (post.userId === req.user.id || req.user.isAdmin === true) {
    try {
      const userId = req.user.id;
      const data = {
        title: req.body.title,
        content: req.body.content,
        user: {
          connect: { id: userId },
        },
      };

      if (req.file) {
        post.image = `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`;
      }

      const result = await prisma.post
        .update({
          where: {
            id: req.params.id,
          },
          data: { ...data },
        })
        .then(() => {
          res.status(200).json({
            status: true,
            message: "Post updated !",
            data: post,
          });
        })
        .catch((err) => console.log("l erreur est : ", err));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

//Récupération de tout les postes
exports.allPost = async (req, res, next) => {
  try {
    const allPost = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        createAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createAt: "desc",
      },
    });
    res.status(200).json({
      status: true,
      message: "All Posts",
      data: allPost,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

//Récupère un poste unique par l'id
exports.onePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const onePost = await prisma.post.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        likes: true,
      },
    });
    if (!onePost) {
      return res.status(404).json({
        message: "not found",
      });
    }
    res.status(200).json({
      status: true,
      message: "One post",
      data: onePost,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

//Supprimer un post
exports.delete = async (req, res, next) => {
  const post = await prisma.post.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });
  if (!post) {
    return res.status(404).json({
      message: "not found",
    });
  }
  if (post.userId === req.user.id || req.user.isAdmin === true) {
    const image = req.body.image;
    const filename = String(image).split("/image/")[1];
    fs.unlink(`image/${filename}`, async () => {
      try {
        const post = await prisma.post.delete({
          where: {
            id: req.params.id,
          },
        });
        res.status(200).json({
          status: true,
          message: "Post deleted !",
        });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });
  } else {
    res.status(403).json({ message: "pas autorisé" });
  }
};

//Like Post
exports.like = async (req, res, next) => {
  try {
    console.log('req.body', req.body)
    const post = await prisma.post
      .findUnique({
        where: {
          id: req.params.id,
        },
        include: {
          likes: true,
        },
      })
      .then((post) => {
        if (post.likes.indexOf(req.body.userId) == -1) {
          post.likes.push(req.body.userId);
          console.log('if')
        } else {
          const likesIndex = post.likes.findIndex(
            (user) => user === req.body.userId
          );
          post.likes.splice(likesIndex, 1);
          console.log('else')
        }
        console.log('avant maj')
        const update = prisma.post.update(
          {
            where: {
              id: req.params.id,
            },
            data: { ...post },
          }
        )
        .then((post) => {
           console.log('tout s est bien enregistré')
        })
      })
      .catch((err) => console.log("l erreur est : ", err));
      res.status(200).json({
      status: true,
      message: "Requête émise",
      data: post,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};
