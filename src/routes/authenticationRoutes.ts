import { Router } from "express";
import { UserFromJSON } from "@dto/User";
import { getToken } from "@controllers/authController";

const router = Router();

//Authenticate
router.post("", async (req, res, next) => {
  try {
    res.status(200).json(await getToken(UserFromJSON(req.body)));
  } catch (error) {
    next(error);
  }
});

export default router;
