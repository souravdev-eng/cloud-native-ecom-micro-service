### ecom-micro/common helps developer to catch production level nodejs application error easy way.

`app.use(errorHandler)` function is to catch global level error. It's alternative to express error controller. You need to use it in your `app.js` or where you write your express app logic.

#### Example to use any error class

```JavaScript
import { BadRequestError } from '@ecom-micro/common';

return next(new BadRequestError('Invalid email or password'));
// OR
throw new BadRequestError('Invalid email or password');
```

##### List of method

```JavaScript
import { BadRequestError, NotFoundError, errorHandler } from '@ecom-micro/common';
```
