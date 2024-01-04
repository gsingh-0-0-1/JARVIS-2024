# JARVIS 2024

## Code Standard & Conventions

### Repo Policies

No initial work should ever be done on `master`. Merges to master will be handled by the team lead and the designated reviewers for any feature or module. For all practical purposes, all development will be done on a branch with a name prefixed by `dev/` -- see the branch `dev/gsingh_dev`.

For those unfamiliar with Git and Github, that process will look something like this:

```

git branch dev/[your_branch_name]
git checkout dev/[your_branch_name]
...[make changes]...
git add [your changed files]
git commit -m "[your commit message]"
git push origin dev/[your_branch_name]

```

### Code Standards

Every function you write should be preceded by a multiline comment describing the function. For example, in Python:

```

'''
An incredibly frustrating way to take the sum of two numbers.
Do not use in production!
'''
def dumb_sum(a, b):
	s = 0
	for i in range(a):
		s = s + 1

	for j in range(b):
		s = s + 1
	
	return s
```

