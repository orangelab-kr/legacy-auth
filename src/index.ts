import { auth, firestore, logger } from './tools';

const userCol = firestore.collection('users');

async function main() {
  let count = 0;
  const funcs = [];
  const users = await getUsers();
  const usersCount = users.length;
  for (const user of users) {
    funcs.push(async () => {
      count++;
      const userDoc = await user.data();
      userDoc.name = userDoc.name || '고객';
      try {
        const authUser = await auth.getUser(user.id);
        if (userDoc.phone === authUser.phoneNumber) {
          logger.info(
            `[${count}/${usersCount}] ${userDoc.name}님 이미 등록되어 있습니다. ${authUser.phoneNumber} (${user.id})`
          );

          return;
        }

        await userCol.doc(user.id).update({ phone: authUser.phoneNumber });
        logger.info(
          `[${count}/${usersCount}] ${userDoc.name}님 전화번호는 ${authUser.phoneNumber} (${user.id})`
        );
      } catch (err) {
        logger.warn(
          `[${count}/${usersCount}] ${userDoc.name}님은 탈퇴된 사용자입니다. (${user.id})`
        );

        logger.warn(`- ${err.message}`);
      }
    });
  }

  while (funcs.length) {
    await Promise.all(funcs.splice(0, 50).map((f) => f()));
  }
}

async function getUsers(): Promise<
  FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[]
> {
  const results: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = [];
  const users = await userCol.get();
  users.forEach((user) => results.push(user));
  return results;
}

main();
